import { Request, Response } from 'express';

const WAVESPEED_API_KEY = process.env.WAVESPEED_API_KEY;
const WAVESPEED_BASE = 'https://api.wavespeed.ai/api/v3';

const HIDDEN_PROMPT = `TASK: Floor texture replacement in interior room photograph.
INSTRUCTIONS:
Use the provided marble image as the exact texture source.
Apply this marble texture ONLY to the floor area of the room image.
The floor must appear as a continuous seamless marble surface (single slab look). Do NOT create tile divisions, grout lines, seams, or grid patterns.
Do NOT generate or invent new textures. Use the exact marble pattern, colors, and veins from the input marble image.
Scale and map the marble texture naturally using correct perspective so it fits the room realistically without distortion.
If repetition is needed, blend the texture seamlessly so no visible joints or repeating patterns are noticeable.
Match lighting, reflections, and shadows from the room environment to create a polished marble finish.
Preserve reflections under furniture and maintain realistic gloss.
Keep all other elements (walls, bed, furniture) completely unchanged.
Ensure clean and accurate edges where the floor meets walls and objects, with no texture bleeding.
Final output must look like a high-end seamless marble floor (not tiled).`;

const uploadToWaveSpeed = async (
  buffer: Buffer,
  filename: string,
  mimetype: string
): Promise<string> => {
  const form = new FormData();
  const blob = new Blob([new Uint8Array(buffer)], { type: mimetype });
  form.append('file', blob, filename);

  const res = await fetch(`${WAVESPEED_BASE}/media/upload/binary`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${WAVESPEED_API_KEY}`,
    },
    body: form,
  });

  const data = await res.json() as any;
 
  if (data.code !== 200 || !data.data?.download_url) {
    throw new Error(`Upload failed: ${data.message || 'Unknown error'}`);
  }

  return data.data.download_url as string;
};

export const generateFloor = async (req: Request, res: Response) => {
  try {
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    const roomFile   = files?.room?.[0];
    const marbleFile = files?.marble?.[0];

    if (!roomFile || !marbleFile) {
      return res.status(400).json({
        success: false,
        message: 'Both room and marble images are required.',
      });
    }

    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowed.includes(roomFile.mimetype) || !allowed.includes(marbleFile.mimetype)) {
      return res.status(400).json({
        success: false,
        message: 'Only JPEG, PNG, and WebP images are allowed.',
      });
    }

    // Upload both in parallel
    const [roomUrl, marbleUrl] = await Promise.all([
      uploadToWaveSpeed(roomFile.buffer, roomFile.originalname, roomFile.mimetype),
      uploadToWaveSpeed(marbleFile.buffer, marbleFile.originalname, marbleFile.mimetype),
    ]);

    // Call WaveSpeed edit API
    const editRes = await fetch(
      `${WAVESPEED_BASE}/wavespeed-ai/flux-2-klein-9b/edit`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${WAVESPEED_API_KEY}`,
        },
        body: JSON.stringify({
          enable_base64_output: false,
          enable_sync_mode: true,
          images: [roomUrl, marbleUrl],
          prompt: HIDDEN_PROMPT,
          seed: -1,
        }),
      }
    );

    const editData = await editRes.json() as any;
    const outputs   = editData.outputs ?? editData.data?.outputs;
    const resultUrl = Array.isArray(outputs) ? outputs[0] : outputs;

    if (!resultUrl) {
      console.error('WaveSpeed response missing outputs:', editData);
      throw new Error('AI generation succeeded but returned no output URL.');
    }

    return res.json({ success: true, data: { resultUrl } });

  } catch (err: any) {
    console.error('Visualizer error:', err.message);
    return res.status(500).json({
      success: false,
      message: err.message || 'Image generation failed.',
    });
  }
};