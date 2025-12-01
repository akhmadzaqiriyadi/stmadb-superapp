// src/modules/pkl/industry/industry.controller.ts

import type { Request, Response } from 'express';
import { industryService } from './industry.service.js';

// Create Industry
export const createIndustry = async (req: Request, res: Response) => {
  try {
    const industry = await industryService.createIndustry(req.body);

    res.status(201).json({
      message: 'Industri berhasil ditambahkan',
      data: industry,
    });
  } catch (error) {
    res.status(400).json({ message: (error as Error).message });
  }
};

// Get All Industries
export const getAllIndustries = async (req: Request, res: Response) => {
  try {
    const result = await industryService.getAllIndustries(req.query);

    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({ message: (error as Error).message });
  }
};

// Get Active Industries Only
export const getActiveIndustries = async (req: Request, res: Response) => {
  try {
    const industries = await industryService.getActiveIndustries();

    res.status(200).json({ data: industries });
  } catch (error) {
    res.status(400).json({ message: (error as Error).message });
  }
};

// Get Industry by ID
export const getIndustryById = async (req: Request, res: Response) => {
  try {
    const idParam = req.params.id;
    if (!idParam) {
      return res.status(400).json({ message: 'ID industri dibutuhkan' });
    }
    
    const id = parseInt(idParam, 10);
    if (isNaN(id)) {
      return res.status(400).json({ message: 'ID industri tidak valid' });
    }
    
    const industry = await industryService.getIndustryById(id);

    res.status(200).json({ data: industry });
  } catch (error) {
    res.status(404).json({ message: (error as Error).message });
  }
};

// Update Industry
export const updateIndustry = async (req: Request, res: Response) => {
  try {
    const idParam = req.params.id;
    if (!idParam) {
      return res.status(400).json({ message: 'ID industri dibutuhkan' });
    }
    
    const id = parseInt(idParam, 10);
    if (isNaN(id)) {
      return res.status(400).json({ message: 'ID industri tidak valid' });
    }
    
    const industry = await industryService.updateIndustry(id, req.body);

    res.status(200).json({
      message: 'Industri berhasil diupdate',
      data: industry,
    });
  } catch (error) {
    res.status(400).json({ message: (error as Error).message });
  }
};

// Delete Industry
export const deleteIndustry = async (req: Request, res: Response) => {
  try {
    const idParam = req.params.id;
    if (!idParam) {
      return res.status(400).json({ message: 'ID industri dibutuhkan' });
    }
    
    const id = parseInt(idParam, 10);
    if (isNaN(id)) {
      return res.status(400).json({ message: 'ID industri tidak valid' });
    }
    
    const result = await industryService.deleteIndustry(id);

    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({ message: (error as Error).message });
  }
};

// Get Students at Industry
export const getStudentsAtIndustry = async (req: Request, res: Response) => {
  try {
    const idParam = req.params.id;
    if (!idParam) {
      return res.status(400).json({ message: 'ID industri dibutuhkan' });
    }
    
    const id = parseInt(idParam, 10);
    if (isNaN(id)) {
      return res.status(400).json({ message: 'ID industri tidak valid' });
    }
    
    const students = await industryService.getStudentsAtIndustry(id);

    res.status(200).json({ data: students });
  } catch (error) {
    res.status(404).json({ message: (error as Error).message });
  }
};
