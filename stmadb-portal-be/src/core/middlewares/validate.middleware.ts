// src/core/middlewares/validate.middleware.ts
import type { Request, Response, NextFunction } from 'express';
import { z, ZodObject } from 'zod';

// Kita gunakan ZodObject<any> agar fleksibel untuk skema apa pun
export const validate =
  (schema: ZodObject<any>) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Mencocokkan data request dengan skema
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      // Jika valid, lanjutkan ke controller
      return next();
    } catch (error) {
      // Jika tidak valid, kirim response error 400
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: 'Data input tidak valid',
          errors: error.flatten().fieldErrors,
        });
      }
      // Tangani error lainnya
      return res.status(500).json({ message: 'Internal Server Error' });
    }
  };