import { Request, Response } from "express";
import pool from "../database/pool";

/**
 * @route   
 * @desc     
 */ 
 
export const getCategories = async (req: Request, res: Response): Promise<any> => {
  try {
    const parentIdRaw = req.query.parent_id as string;
    const parentId = parentIdRaw ? parseInt(parentIdRaw) : null;

    // Validation: Agar user ne parent_id bheja hai toh wo number hi hona chahiye
    if (parentIdRaw && isNaN(Number(parentId))) {
      return res.status(400).json({ error: "Invalid parent_id format" });
    }

    // Explicit Columns (No SELECT *)
    let query = "SELECT id, name, parent_id FROM categories";
    const params: any[] = [];

    // Logic Fix: Agar parent_id query mein hai toh filter karo, 
    // warna seedha saari categories return karo (Default behavior)
    if (parentIdRaw !== undefined) {
      if (parentId === null) {
        query += " WHERE parent_id IS NULL";
      } else {
        query += " WHERE parent_id = ?";
        params.push(parentId);
      }
    }

    const [rows]: any = await pool.query(query + " ORDER BY name ASC", params);
    return res.status(200).json({ success: true, data: rows });

  } catch (error) {
    console.error("GetCategories Error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

 
export const addCategory = async (req: Request, res: Response): Promise<any> => {
  try {
    let { name, parent_id } = req.body;

    // 1. Validation
    if (!name || name.trim().length < 2) {
      return res.status(400).json({ error: "Category name must be at least 2 characters" });
    }
    name = name.trim();

    // 2. Parent Existence Check (Avoid 500 crash if parent_id is junk)
    if (parent_id) {
      const [parentExists]: any = await pool.query("SELECT id FROM categories WHERE id = ?", [parent_id]);
      if (parentExists.length === 0) {
        return res.status(400).json({ error: "Parent category does not exist" });
      }
    }

    // 3. Insert Category
    const [result]: any = await pool.query(
      "INSERT INTO categories (name, parent_id) VALUES (?, ?)", 
      [name, parent_id ?? null]
    );

    return res.status(201).json({ 
      success: true, 
      id: result.insertId,
      message: "Category added successfully" 
    });

  } catch (error: any) {
    console.error("AddCategory Error:", error);
    
    // SQL UNIQUE constraint violation check (Yeh tabhi chalega jab DB mein UNIQUE index hoga)
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: "Category already exists" });
    }
    return res.status(500).json({ error: "Internal server error" });
  }
};

 
export const updateCategory = async (req: Request, res: Response): Promise<any> => {
  try {
    const { id } = req.params;
    let { name } = req.body;

    if (isNaN(Number(id))) {
      return res.status(400).json({ error: "Invalid category ID" });
    }

    if (!name || name.trim().length < 2) {
      return res.status(400).json({ error: "Category name must be at least 2 characters" });
    }
    name = name.trim();

    const [result]: any = await pool.query(
      "UPDATE categories SET name = ? WHERE id = ?",
      [name, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Category not found" });
    }

    return res.status(200).json({ success: true, message: "Category updated successfully" });

  } catch (error: any) {
    console.error("UpdateCategory Error:", error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: "Category name already exists" });
    }
    return res.status(500).json({ error: "Internal server error" });
  }
};


export const deleteCategory = async (req: Request, res: Response): Promise<any> => {
  try {
    const { id } = req.params;

    if (isNaN(Number(id))) {
      return res.status(400).json({ error: "Invalid category ID" });
    }

    const [result]: any = await pool.query(
      "DELETE FROM categories WHERE id = ?",
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Category not found" });
    }

    return res.status(200).json({ success: true, message: "Category deleted successfully" });

  } catch (error: any) {
    console.error("DeleteCategory Error:", error);
    if (error.code === 'ER_ROW_IS_REFERENCED_2') {
      return res.status(400).json({ error: "Cannot delete — products exist in this category" });
    }
    return res.status(500).json({ error: "Internal server error" });
  }
};