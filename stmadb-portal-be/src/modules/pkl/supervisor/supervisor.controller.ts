// src/modules/pkl/supervisor/supervisor.controller.ts

import type { Request, Response } from 'express';
import { supervisorService } from './supervisor.service.js';

// Get Dashboard Stats (Supervisor)
export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    const supervisorUserId = req.user?.userId;
    if (!supervisorUserId) {
      return res.status(401).json({ message: 'User tidak terautentikasi' });
    }

    const stats = await supervisorService.getDashboardStats(supervisorUserId);

    res.status(200).json({ data: stats });
  } catch (error) {
    res.status(400).json({ message: (error as Error).message });
  }
};

// Get Students Under Supervision
export const getStudentsUnderSupervision = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const userRoles = req.user?.roles || [];
    
    if (!userId) {
      return res.status(401).json({ message: 'User tidak terautentikasi' });
    }

    const result = await supervisorService.getStudentsUnderSupervision(
      userId,
      userRoles,
      req.query
    );

    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({ message: (error as Error).message });
  }
};

// Get Student Progress Detail
export const getStudentProgress = async (req: Request, res: Response) => {
  try {
    const supervisorUserId = req.user?.userId;
    if (!supervisorUserId) {
      return res.status(401).json({ message: 'User tidak terautentikasi' });
    }

    const assignmentIdParam = req.params.assignmentId;
    if (!assignmentIdParam) {
      return res.status(400).json({ message: 'ID assignment dibutuhkan' });
    }

    const assignmentId = parseInt(assignmentIdParam, 10);
    if (isNaN(assignmentId)) {
      return res.status(400).json({ message: 'ID assignment tidak valid' });
    }

    const progress = await supervisorService.getStudentProgress(
      assignmentId,
      supervisorUserId
    );

    res.status(200).json({ data: progress });
  } catch (error) {
    res.status(404).json({ message: (error as Error).message });
  }
};

// Get All Pending Items
export const getAllPendingItems = async (req: Request, res: Response) => {
  try {
    const supervisorUserId = req.user?.userId;
    if (!supervisorUserId) {
      return res.status(401).json({ message: 'User tidak terautentikasi' });
    }

    const pending = await supervisorService.getAllPendingItems(supervisorUserId);

    res.status(200).json({ data: pending });
  } catch (error) {
    res.status(400).json({ message: (error as Error).message });
  }
};

// Admin: Get Overall Statistics
export const getAdminStatistics = async (req: Request, res: Response) => {
  try {
    const stats = await supervisorService.getAdminStatistics();

    res.status(200).json({ data: stats });
  } catch (error) {
    res.status(400).json({ message: (error as Error).message });
  }
};
