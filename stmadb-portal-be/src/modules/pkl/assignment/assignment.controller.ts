// src/modules/pkl/assignment/assignment.controller.ts

import type { Request, Response } from 'express';
import { assignmentService } from './assignment.service.js';
import { PKLStatus } from '@prisma/client';

// Create Assignment
export const createAssignment = async (req: Request, res: Response) => {
  try {
    const assignment = await assignmentService.createAssignment(req.body);

    res.status(201).json({
      message: 'Assignment PKL berhasil dibuat',
      data: assignment,
    });
  } catch (error) {
    res.status(400).json({ message: (error as Error).message });
  }
};

// Get All Assignments
export const getAllAssignments = async (req: Request, res: Response) => {
  try {
    const result = await assignmentService.getAllAssignments(req.query);

    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({ message: (error as Error).message });
  }
};

// Get My Assignment (Student)
export const getMyAssignment = async (req: Request, res: Response) => {
  try {
    const studentUserId = req.user?.userId;
    if (!studentUserId) {
      return res.status(401).json({ message: 'User tidak terautentikasi' });
    }

    const assignment = await assignmentService.getMyAssignment(studentUserId);

    res.status(200).json({ data: assignment });
  } catch (error) {
    res.status(400).json({ message: (error as Error).message });
  }
};

// Get Assignment by ID
export const getAssignmentById = async (req: Request, res: Response) => {
  try {
    const idParam = req.params.id;
    if (!idParam) {
      return res.status(400).json({ message: 'ID assignment dibutuhkan' });
    }

    const id = parseInt(idParam, 10);
    if (isNaN(id)) {
      return res.status(400).json({ message: 'ID assignment tidak valid' });
    }

    const assignment = await assignmentService.getAssignmentById(id);

    res.status(200).json({ data: assignment });
  } catch (error) {
    res.status(404).json({ message: (error as Error).message });
  }
};

// Update Assignment
export const updateAssignment = async (req: Request, res: Response) => {
  try {
    const idParam = req.params.id;
    if (!idParam) {
      return res.status(400).json({ message: 'ID assignment dibutuhkan' });
    }

    const id = parseInt(idParam, 10);
    if (isNaN(id)) {
      return res.status(400).json({ message: 'ID assignment tidak valid' });
    }

    const assignment = await assignmentService.updateAssignment(id, req.body);

    res.status(200).json({
      message: 'Assignment PKL berhasil diupdate',
      data: assignment,
    });
  } catch (error) {
    res.status(400).json({ message: (error as Error).message });
  }
};

// Update Assignment Status
export const updateAssignmentStatus = async (req: Request, res: Response) => {
  try {
    const idParam = req.params.id;
    if (!idParam) {
      return res.status(400).json({ message: 'ID assignment dibutuhkan' });
    }

    const id = parseInt(idParam, 10);
    if (isNaN(id)) {
      return res.status(400).json({ message: 'ID assignment tidak valid' });
    }

    const { status } = req.body as { status: PKLStatus };

    const assignment = await assignmentService.updateAssignmentStatus(id, status);

    res.status(200).json({
      message: 'Status assignment berhasil diupdate',
      data: assignment,
    });
  } catch (error) {
    res.status(400).json({ message: (error as Error).message });
  }
};

// Delete Assignment
export const deleteAssignment = async (req: Request, res: Response) => {
  try {
    const idParam = req.params.id;
    if (!idParam) {
      return res.status(400).json({ message: 'ID assignment dibutuhkan' });
    }

    const id = parseInt(idParam, 10);
    if (isNaN(id)) {
      return res.status(400).json({ message: 'ID assignment tidak valid' });
    }

    const result = await assignmentService.deleteAssignment(id);

    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({ message: (error as Error).message });
  }
};

// Get Assignment by Student ID
export const getAssignmentByStudentId = async (req: Request, res: Response) => {
  try {
    const studentIdParam = req.params.studentId;
    if (!studentIdParam) {
      return res.status(400).json({ message: 'ID siswa dibutuhkan' });
    }

    const studentId = parseInt(studentIdParam, 10);
    if (isNaN(studentId)) {
      return res.status(400).json({ message: 'ID siswa tidak valid' });
    }

    const assignments = await assignmentService.getAssignmentByStudentId(studentId);

    res.status(200).json({ data: assignments });
  } catch (error) {
    res.status(400).json({ message: (error as Error).message });
  }
};

// Add Allowed Location
export const addAllowedLocation = async (req: Request, res: Response) => {
  try {
    const idParam = req.params.id;
    if (!idParam) {
      return res.status(400).json({ message: 'ID assignment dibutuhkan' });
    }

    const id = parseInt(idParam, 10);
    if (isNaN(id)) {
      return res.status(400).json({ message: 'ID assignment tidak valid' });
    }

    const location = await assignmentService.addAllowedLocation(id, req.body);

    res.status(201).json({
      message: 'Lokasi berhasil ditambahkan',
      data: location,
    });
  } catch (error) {
    res.status(400).json({ message: (error as Error).message });
  }
};

// Remove Allowed Location
export const removeAllowedLocation = async (req: Request, res: Response) => {
  try {
    const locationIdParam = req.params.locationId;
    if (!locationIdParam) {
      return res.status(400).json({ message: 'ID lokasi dibutuhkan' });
    }

    const locationId = parseInt(locationIdParam, 10);
    if (isNaN(locationId)) {
      return res.status(400).json({ message: 'ID lokasi tidak valid' });
    }

    const result = await assignmentService.removeAllowedLocation(locationId);

    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({ message: (error as Error).message });
  }
};

// Get Allowed Locations
export const getAllowedLocations = async (req: Request, res: Response) => {
  try {
    const idParam = req.params.id;
    if (!idParam) {
      return res.status(400).json({ message: 'ID assignment dibutuhkan' });
    }

    const id = parseInt(idParam, 10);
    if (isNaN(id)) {
      return res.status(400).json({ message: 'ID assignment tidak valid' });
    }

    const locations = await assignmentService.getAllowedLocations(id);

    res.status(200).json({ data: locations });
  } catch (error) {
    res.status(400).json({ message: (error as Error).message });
  }
};
