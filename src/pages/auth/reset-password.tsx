/* eslint-disable @typescript-eslint/no-unsafe-call */
import { type NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import { getSession } from "next-auth/react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { api } from "@/utils/api";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from "next/router";

const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .trim()
      .min(8, { message: "Password must be at least 8 characters" })
      .max(100, { message: "Password must not exceed 100 characters" })
      .regex(/^(?=.*[a-z]).*$/, {
        message: "Password must contain a lowercase",
      })
      .regex(/^(?=.*[A-Z]).*$/, {
        message: "Password must contain a uppercase",
      })
      .regex(/^(?=.*\d).*$/, { message: "Password must contain a number" })
      .regex(/^(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).*$/, {
        message: "Password must contain a symbol",
      }),
    confirmPassword: z
      .string()
      .trim()
      .min(8, { message: "Password must be at least 8 characters" })
      .max(100, { message: "Password must not exceed 100 characters" })
      .regex(/^(?=.*[a-z]).*$/, {
        message: "Password must contain a lowercase",
      })
      .regex(/^(?=.*[A-Z]).*$/, {
        message: "Password must contain a uppercase",
      })
      .regex(/^(?=.*\d).*$/, { message: "Password must contain a number" })
      .regex(/^(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).*$/, {
        message: "Password must contain a symbol",
      }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });

type ResetPasswordSchema = z.infer<typeof resetPasswordSchema>;

const ResetPassword: NextPage = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordSchema>({
    // @typescript-eslint/no-unsafe-assignment
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    resolver: zodResolver(resetPasswordSchema),
  });
  const router = useRouter();
  const { token } = router.query;
  const { toast } = useToast();

  const { mutate: resetPassword, isLoading: loading } =
    api.auth.resetPassword.useMutation({
      onSuccess: async () => {
        await router.push("/auth/login");
      },
      onError: (e) => {
        const errorMessage = e.data?.zodError?.fieldErrors.content;
        if (errorMessage && errorMessage[0]) {
          toast({
            description: errorMessage[0],
          });
        } else {
          toast({
            description: (e.data?.code as string) || "An error occurred",
          });
        }
      },
    });

  const onSubmit = (data: ResetPasswordSchema) => {
    resetPassword({ token: token as string, ...data });
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === " ") {
      event.preventDefault();
    }
  };

  return (
    <>
      <Head>
        <title>DuitHive</title>
        <meta name="description" content="DuitHive" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className="flex h-screen">
        <div className="relative hidden flex-1 md:block">
          <img
            src="/login-image.png"
            alt="Login Image"
            draggable="false"
            className="h-full w-full object-cover"
          />
        </div>
        <div className="flex flex-1 items-center justify-center font-satoshi">
          <div className="w-full max-w-md px-4 py-4 md:max-w-sm">
            <div className="mx-auto flex items-center justify-center font-display text-3xl font-bold tracking-widest">
              <img src="/logo.png" className="w-16 pr-4" alt="logo" />
              <span className="text-violet-600">Duit</span>Hive
            </div>
            <h2 className="my-4 font-display text-2xl tracking-wide">
              Reset Password
            </h2>
            <form
              className="flex flex-col gap-4"
              // eslint-disable-next-line @typescript-eslint/no-misused-promises
              onSubmit={handleSubmit(onSubmit)}
            >
              <div>
                <label htmlFor="password" className="text-sm">
                  Password
                </label>
                <Input
                  type="password"
                  className="mt-2 border border-input"
                  onKeyDown={handleKeyDown}
                  {...register("password", { required: true })}
                />
                {errors.password && (
                  <span className="text-xxs text-red-500">
                    {errors.password.message}
                  </span>
                )}
              </div>

              <div>
                <label htmlFor="password" className="text-sm">
                  Confirm Password
                </label>
                <Input
                  type="password"
                  className="mt-2 border border-input"
                  onKeyDown={handleKeyDown}
                  {...register("confirmPassword", { required: true })}
                />
                {errors.confirmPassword && (
                  <span className="text-xxs text-red-500">
                    {errors.confirmPassword.message}
                  </span>
                )}
              </div>
              <Button type="submit" disabled={loading} className="mt-10">
                {loading ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#803FE8"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-4 w-4 animate-spin"
                  >
                    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                  </svg>
                ) : (
                  <span>Reset Password</span>
                )}
              </Button>
            </form>
            <p className="mt-8 whitespace-pre text-center text-xs font-medium">
              Have an account?
              <Link
                className="whitespace-pre text-xs text-violet-500"
                href="/auth/login"
              >
                &nbsp;Login
              </Link>
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getServerSideProps(context: any) {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  const session = await getSession(context);
  if (session) {
    return {
      redirect: {
        destination: "/dashboard",
        permanent: false,
      },
    };
  }

  return {
    props: { session },
  };
}

export default ResetPassword;
