import { Request, Response } from "express";
import pool from "../database/pool";
import { AuthRequest } from "../middleware/auth.middleware";

// --- SERVICE TYPES ---

export const addServiceType = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: "Type name is required" });

    await pool.query("INSERT INTO service_types (name) VALUES (?)", [name.trim()]);
    return res.status(201).json({ success: true, message: "Service type added!" });
  } catch (error: any) {
    if (error.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: "This service type already exists." });
    console.error("AddServiceType Error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const getAllTypes = async (req: Request, res: Response): Promise<any> => {
  try {
    const [rows]: any = await pool.query("SELECT id, name FROM service_types WHERE is_active = true");
    return res.status(200).json({ success: true, data: rows });
  } catch (error) {
    console.error("GetAllTypes Error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const deleteServiceType = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { id } = req.params;
    await pool.query("UPDATE service_types SET is_active = false WHERE id = ?", [id]);
    return res.status(200).json({ success: true, message: "Type soft deleted successfully." });
  } catch (error) {
    console.error("DeleteType Error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// --- SERVICE PROVIDERS ---

// ✅ Corrected Validation & Path
export const addServiceProvider = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { service_type_id, name, phone, description } = req.body;
    
    // 1. Correct OR operator for validation
    if (!service_type_id || !name || !phone) {
        return res.status(400).json({ error: "Required fields missing: service_type_id, name, or phone" });
    }

    // 2. Correct path for services
    const photo_url = req.file ? `/uploads/services/${req.file.filename}` : null; 

    await pool.query(
      "INSERT INTO service_providers (service_type_id, name, phone, photo_url, description) VALUES (?, ?, ?, ?, ?)",
      [service_type_id, name, phone, photo_url, description ?? null]
    );

    return res.status(201).json({ success: true, message: "Service provider added!" });
  } catch (error) {
    console.error("AddProvider Error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const getGroupedProviders = async (req: Request, res: Response): Promise<any> => {
  try {
    const query = `
      SELECT 
        st.id AS type_id, st.name AS type_name,
        sp.id AS provider_id, sp.name AS provider_name, sp.phone, sp.photo_url, sp.description
      FROM service_types st
      LEFT JOIN service_providers sp ON st.id = sp.service_type_id AND sp.is_active = true
      WHERE st.is_active = true
      ORDER BY st.name ASC
    `;

    const [rows]: any = await pool.query(query);

    // Dynamic Grouping Logic
    const groupedData = rows.reduce((acc: any, row: any) => {
      let type = acc.find((t: any) => t.type_id === row.type_id);
      if (!type) {
        type = { type_id: row.type_id, type_name: row.type_name, providers: [] };
        acc.push(type);
      }
      if (row.provider_id) {
        type.providers.push({
          id: row.provider_id,
          name: row.provider_name,
          phone: row.phone,
          photo_url: row.photo_url,
          description: row.description
        });
      }
      return acc;
    }, []);

    return res.status(200).json({ success: true, data: groupedData });
  } catch (error) {
    console.error("GetGroupedProviders Error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const updateProvider = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { id } = req.params;
    const { name, phone, description, service_type_id } = req.body;
    const new_photo_url = req.file ? `/uploads/services/${req.file.filename}` : null;

    const [result]: any = await pool.query(
      `UPDATE service_providers SET 
        name = COALESCE(?, name), 
        phone = COALESCE(?, phone), 
        description = COALESCE(?, description),
        service_type_id = COALESCE(?, service_type_id),
        photo_url = COALESCE(?, photo_url)
      WHERE id = ?`,
      [name ?? null, phone ?? null, description ?? null, service_type_id ?? null, new_photo_url, id]
    );

    if (result.affectedRows === 0) return res.status(404).json({ error: "Provider not found" });

    return res.status(200).json({ success: true, message: "Provider updated!" });
  } catch (error) {
    console.error("UpdateProvider Error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const deleteProvider = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { id } = req.params;
    await pool.query("UPDATE service_providers SET is_active = false WHERE id = ?", [id]);
    return res.status(200).json({ success: true, message: "Provider soft deleted." });
  } catch (error) {
    console.error("DeleteProvider Error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};