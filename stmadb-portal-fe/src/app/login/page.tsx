// src/app/login/page.tsx
"use client";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import api from "@/lib/axios";
import { useAuthStore } from "@/store/authStore";
import { User } from "@/types";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Skema validasi sesuai dengan backend `auth.validation.ts`
const loginSchema = z.object({
  email: z.string().email("Format email tidak valid"),
  password: z.string().min(1, "Password tidak boleh kosong"),
});

// Tipe untuk response API login
interface LoginResponse {
  message: string;
  data: {
    user: User;
    token: string;
  };
}

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuthStore();

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const { mutate: loginUser, isPending } = useMutation<
    LoginResponse,
    Error,
    z.infer<typeof loginSchema>
  >({
    mutationFn: (credentials) =>
      api.post("/auth/login", credentials).then((res) => res.data),
    onSuccess: (data) => {
      console.log("Login successful:", data);
      login(data.data.user, data.data.token);
      router.push("/dashboard"); // Redirect ke dashboard setelah login
    },
    onError: (error) => {
      // Di sini Anda bisa menampilkan notifikasi error (misal: menggunakan toast)
      console.error("Login failed:", error.message);
      alert("Login Gagal! Cek kembali email dan password Anda.");
    },
  });

  function onSubmit(values: z.infer<typeof loginSchema>) {
    loginUser(values);
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <Card className="w-[400px]">
        <CardHeader>
          <CardTitle>STMADB Portal Login</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="admin@portal.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="******" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isPending}>
                {isPending ? "Loading..." : "Login"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}