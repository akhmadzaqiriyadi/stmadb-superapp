// src/modules/academics/academics.controller.ts
import type { Request, Response } from 'express';
import * as academicService from './academics.service.js';
import { Prisma } from '@prisma/client';

export const createAcademicYear = async (req: Request, res: Response) => {
  try {
    const academicYear = await academicService.createAcademicYear(req.body);
    res.status(201).json({ message: 'Tahun Ajaran berhasil dibuat', data: academicYear });
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};

export const getAllAcademicYears = async (req: Request, res: Response) => {
  try {
    const academicYears = await academicService.getAllAcademicYears();
    res.status(200).json(academicYears);
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};

// --- FUNGSI YANG DIPERBAIKI ---
export const getAcademicYearById = async (req: Request, res: Response) => {
    try {
      const { id } = req.params; // Ambil ID dari params
      // 1. Tambahkan pengecekan di sini
      if (!id) {
        return res.status(400).json({ message: 'ID Tahun Ajaran dibutuhkan' });
      }
      // 2. Sekarang aman untuk digunakan karena kita tahu 'id' adalah string
      const numericId = parseInt(id, 10);
      const academicYear = await academicService.getAcademicYearById(numericId);

      if (!academicYear) {
        return res.status(404).json({ message: 'Tahun Ajaran tidak ditemukan' });
      }
      res.status(200).json(academicYear);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
};

// --- FUNGSI YANG DIPERBAIKI ---
export const updateAcademicYear = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!id) {
        return res.status(400).json({ message: 'ID Tahun Ajaran dibutuhkan' });
    }
    const numericId = parseInt(id, 10);
    const academicYear = await academicService.updateAcademicYear(numericId, req.body);
    res.status(200).json({ message: 'Tahun Ajaran berhasil diperbarui', data: academicYear });
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};

// --- FUNGSI YANG DIPERBAIKI ---
export const deleteAcademicYear = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!id) {
        return res.status(400).json({ message: 'ID Tahun Ajaran dibutuhkan' });
    }
    const numericId = parseInt(id, 10);
    await academicService.deleteAcademicYear(numericId);
    res.status(200).json({ message: 'Tahun Ajaran berhasil dihapus' });
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};

// --- FUNGSI TAMBAHAN UNTUK MENDAPATKAN TAHUN AJARAN AKTIF ---
export const getActiveAcademicYear = async (req: Request, res: Response) => {
  try {
    const activeYear = await academicService.getActiveAcademicYear();
    if (!activeYear) {
      return res.status(404).json({ message: 'Tidak ada tahun ajaran yang aktif saat ini' });
    }
    res.status(200).json(activeYear);
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};

// --- CONTROLLERS FOR MAJOR (JURUSAN) ---

export const createMajor = async (req: Request, res: Response) => {
  try {
    const major = await academicService.createMajor(req.body);
    res.status(201).json({ message: 'Jurusan berhasil dibuat', data: major });
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};

export const getAllMajors = async (req: Request, res: Response) => {
  try {
    const majors = await academicService.getAllMajors();
    res.status(200).json(majors);
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};

export const getMajorById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ message: 'ID Jurusan dibutuhkan' });
    }
    const numericId = parseInt(id, 10);
    const major = await academicService.getMajorById(numericId);
    if (!major) {
      return res.status(404).json({ message: 'Jurusan tidak ditemukan' });
    }
    res.status(200).json(major);
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};


// --- FUNGSI YANG DIPERBAIKI ---
export const updateMajor = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!id) {
        return res.status(400).json({ message: 'ID Jurusan dibutuhkan' });
    }
    const numericId = parseInt(id, 10);
    const major = await academicService.updateMajor(numericId, req.body);
    res.status(200).json({ message: 'Jurusan berhasil diperbarui', data: major });
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};

// --- FUNGSI YANG DIPERBAIKI ---
export const deleteMajor = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!id) {
        return res.status(400).json({ message: 'ID Jurusan dibutuhkan' });
    }
    const numericId = parseInt(id, 10);
    await academicService.deleteMajor(numericId);
    res.status(200).json({ message: 'Jurusan berhasil dihapus' });
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};


// --- CONTROLLERS FOR SUBJECT (MATA PELAJARAN) ---
export const createSubject = async (req: Request, res: Response) => {
  try {
    const subject = await academicService.createSubject(req.body);
    res.status(201).json({ message: 'Mata Pelajaran berhasil dibuat', data: subject });
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};

export const getAllSubjects = async (req: Request, res: Response) => {
  try {
    // Cukup teruskan query ke service
    const subjects = await academicService.getAllSubjects(req.query);
    res.status(200).json(subjects);
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};

export const getSubjectById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ message: 'ID Mata Pelajaran dibutuhkan' });
    const subject = await academicService.getSubjectById(parseInt(id, 10));
    if (!subject) return res.status(404).json({ message: 'Mata Pelajaran tidak ditemukan' });
    res.status(200).json(subject);
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};

export const updateSubject = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ message: 'ID Mata Pelajaran dibutuhkan' });
    const subject = await academicService.updateSubject(parseInt(id, 10), req.body);
    res.status(200).json({ message: 'Mata Pelajaran berhasil diperbarui', data: subject });
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};

export const deleteSubject = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ message: 'ID Mata Pelajaran dibutuhkan' });
    await academicService.deleteSubject(parseInt(id, 10));
    res.status(200).json({ message: 'Mata Pelajaran berhasil dihapus' });
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};

// --- CONTROLLERS FOR CLASS (KELAS) ---
export const createClass = async (req: Request, res: Response) => {
  try {
    const newClass = await academicService.createClass(req.body);
    res.status(201).json({ message: 'Kelas berhasil dibuat', data: newClass });
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};

export const getAllClasses = async (req: Request, res: Response) => {
  try {
    const result = await academicService.getAllClasses(req.query);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};

export const getClassById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ message: 'ID Kelas dibutuhkan' });
    const singleClass = await academicService.getClassById(parseInt(id, 10));
    if (!singleClass) return res.status(404).json({ message: 'Kelas tidak ditemukan' });
    res.status(200).json(singleClass);
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};

export const updateClass = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ message: 'ID Kelas dibutuhkan' });
    const updatedClass = await academicService.updateClass(parseInt(id, 10), req.body);
    res.status(200).json({ message: 'Kelas berhasil diperbarui', data: updatedClass });
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};

export const deleteClass = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ message: 'ID Kelas dibutuhkan' });
    await academicService.deleteClass(parseInt(id, 10));
    res.status(200).json({ message: 'Kelas berhasil dihapus' });
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};

// Controller untuk mengambil daftar guru
export const getTeachersForHomeroom = async (req: Request, res: Response) => {
    try {
        const teachers = await academicService.getAllTeachers();
        res.status(200).json(teachers);
    } catch (error) {
        res.status(500).json({ message: (error as Error).message });
    }
}

export const addStudentToClass = async (req: Request, res: Response) => {
  try {
    // **PERBAIKAN 2: Tambahkan pengecekan `id`**
    const { id } = req.params;
    if (!id) {
        return res.status(400).json({ message: 'ID Kelas dibutuhkan' });
    }
    const classId = parseInt(id, 10);
    const newMember = await academicService.addStudentToClass(classId, req.body);
    res.status(201).json({ message: 'Siswa berhasil ditambahkan ke kelas', data: newMember });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        return res.status(409).json({ message: 'Siswa ini sudah terdaftar di kelas lain pada tahun ajaran yang sama.' });
    }
    res.status(500).json({ message: (error as Error).message });
  }
};

export const getClassMembers = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({ message: 'ID Kelas dibutuhkan' });
        }
        const classId = parseInt(id, 10);
        // Teruskan semua query (termasuk academicYearId, page, q) ke service
        const members = await academicService.getClassMembers(classId, req.query);
        res.status(200).json(members);
    } catch (error) {
        res.status(500).json({ message: (error as Error).message });
    }
};


export const removeStudentFromClass = async (req: Request, res: Response) => {
  try {
    const { memberId } = req.params;
    if (!memberId) {
        return res.status(400).json({ message: 'ID Anggota Kelas dibutuhkan' });
    }
    const classMemberId = parseInt(memberId, 10);
    await academicService.removeStudentFromClass(classMemberId);
    res.status(200).json({ message: 'Siswa berhasil dikeluarkan dari kelas' });
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};

export const getAvailableStudents = async (req: Request, res: Response) => {
    try {
        const students = await academicService.getAvailableStudents(req.query);
        res.status(200).json(students);
    } catch (error) {
        res.status(500).json({ message: (error as Error).message });
    }
};


// --- CONTROLLER UNTUK PENUGASAN GURU (TEACHER ASSIGNMENT) ---

export const createTeacherAssignment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ message: 'ID Kelas dibutuhkan' });
    const classId = parseInt(id, 10);
    
    const newAssignment = await academicService.createTeacherAssignment(classId, req.body);
    res.status(201).json({ message: 'Penugasan guru berhasil dibuat', data: newAssignment });
  } catch (error) {
     if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        return res.status(409).json({ message: 'Kombinasi Guru, Mata Pelajaran, dan Kelas ini sudah ada.' });
    }
    res.status(500).json({ message: (error as Error).message });
  }
};

export const getAssignmentsByClass = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        if (!id) return res.status(400).json({ message: 'ID Kelas dibutuhkan' });
        const classId = parseInt(id, 10);
        
        const { academicYearId } = req.query;
        if (!academicYearId) return res.status(400).json({ message: 'Parameter academicYearId dibutuhkan' });

        const assignments = await academicService.getAssignmentsByClass(classId, Number(academicYearId));
        res.status(200).json(assignments);
    } catch (error) {
        res.status(500).json({ message: (error as Error).message });
    }
};

export const deleteTeacherAssignment = async (req: Request, res: Response) => {
    try {
        const { assignmentId } = req.params;
        if (!assignmentId) return res.status(400).json({ message: 'ID Penugasan dibutuhkan' });
        
        await academicService.deleteTeacherAssignment(parseInt(assignmentId, 10));
        res.status(200).json({ message: 'Penugasan berhasil dihapus' });
    } catch (error) {
        res.status(500).json({ message: (error as Error).message });
    }
};


// --- CONTROLLER UNTUK RUANGAN (ROOM) ---

export const createRoom = async (req: Request, res: Response) => {
  try {
    const room = await academicService.createRoom(req.body);
    res.status(201).json({ message: 'Ruangan berhasil dibuat', data: room });
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};

export const getAllRooms = async (req: Request, res: Response) => {
  try {
    // Cukup teruskan semua query parameters ke service
    const rooms = await academicService.getAllRooms(req.query);
    res.status(200).json(rooms);
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};


export const updateRoom = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ message: 'ID Ruangan dibutuhkan' });
    const room = await academicService.updateRoom(parseInt(id, 10), req.body);
    res.status(200).json({ message: 'Ruangan berhasil diperbarui', data: room });
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};

export const deleteRoom = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ message: 'ID Ruangan dibutuhkan' });
    await academicService.deleteRoom(parseInt(id, 10));
    res.status(200).json({ message: 'Ruangan berhasil dihapus' });
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};

// --- CONTROLLER UNTUK JADWAL (SCHEDULE) ---

export const createSchedule = async (req: Request, res: Response) => {
  try {
    const newSchedule = await academicService.createSchedule(req.body);
    res.status(201).json({ message: 'Jadwal berhasil dibuat', data: newSchedule });
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};

export const getSchedulesByClass = async (req: Request, res: Response) => {
  try {
    const { classId } = req.params;
    if (!classId) return res.status(400).json({ message: 'ID Kelas dibutuhkan' });
    const { academicYearId } = req.query;
    if (!academicYearId) return res.status(400).json({ message: 'ID Tahun Ajaran dibutuhkan' });

    const schedules = await academicService.getSchedulesByClass(parseInt(classId, 10), Number(academicYearId));
    res.status(200).json(schedules);
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};

export const updateSchedule = async (req: Request, res: Response) => {
  try {
    const { scheduleId } = req.params;
    if (!scheduleId) return res.status(400).json({ message: 'ID Jadwal dibutuhkan' });
    const updatedSchedule = await academicService.updateSchedule(parseInt(scheduleId, 10), req.body);
    res.status(200).json({ message: 'Jadwal berhasil diperbarui', data: updatedSchedule });
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};

export const deleteSchedule = async (req: Request, res: Response) => {
  try {
    const { scheduleId } = req.params;
    if (!scheduleId) return res.status(400).json({ message: 'ID Jadwal dibutuhkan' });
    await academicService.deleteSchedule(parseInt(scheduleId, 10));
    res.status(200).json({ message: 'Jadwal berhasil dihapus' });
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};
