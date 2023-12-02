/* eslint-disable @typescript-eslint/no-unsafe-call */
import { type NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import Image from "next/image";
import { signIn } from "next-auth/react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
// import { api } from "@/utils/api";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/components/ui/use-toast";
import { useState } from "react";
import { Loader2 } from "lucide-react";

const loginSchema = z.object({
  email: z.string().email().min(5),
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters" })
    .max(100, { message: "Password must not exceed 100 characters" })
    .regex(/^(?=.*[a-z]).*$/, { message: "Password must contain a lowercase" })
    .regex(/^(?=.*[A-Z]).*$/, { message: "Password must contain a uppercase" })
    .regex(/^(?=.*\d).*$/, { message: "Password must contain a number" })
    .regex(/^(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).*$/, {
      message: "Password must contain a symbol",
    }),
});

type LoginSchema = z.infer<typeof loginSchema>;

const Login: NextPage = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginSchema>({
    // @typescript-eslint/no-unsafe-assignment
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    resolver: zodResolver(loginSchema),
  });
  const [loading, setLoading] = useState<boolean>(false);
  const { toast } = useToast();

  const onSubmit = async (data: LoginSchema) => {
    setLoading(true);
    const signInRes = await signIn("credentials", {
      email: data.email,
      password: data.password,
      redirect: false,
    });

    if (signInRes?.ok) {
      window.location.replace("/dashboard");
    } else {
      toast({
        variant: "error",
        status: "error",
        title: signInRes?.error || "An error occurred",
      });
    }
    setLoading(false);
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
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/login-image.png"
            alt="Login Image"
            className="h-full w-full object-cover"
          />
        </div>
        <div className="flex flex-1 items-center justify-center font-satoshi">
          <div className="w-full max-w-md px-4 py-4 md:max-w-sm">
            <div className="mx-auto flex items-center justify-center font-display text-3xl font-bold tracking-widest">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.png" className="w-16 pr-4" alt="logo" />
              <span className="text-violet-600">Duit</span>Hive
            </div>
            <h2
              data-testid="heading"
              className="my-4 font-display text-2xl font-normal tracking-wide"
            >
              Log In
            </h2>
            <p className="mb-4 font-satoshi text-lg font-semibold">
              Welcome Back!
            </p>
            <form
              className="flex flex-col gap-4"
              // eslint-disable-next-line @typescript-eslint/no-misused-promises
              onSubmit={handleSubmit(onSubmit)}
            >
              <div>
                <label htmlFor="email" className="text-sm">
                  Email
                </label>
                <Input
                  data-testid="email-input"
                  className="mt-2 border border-input"
                  {...register("email", { required: true })}
                />
                {errors.email && (
                  <span className="text-xxs text-red-500">
                    {errors.email.message}
                  </span>
                )}
              </div>
              <div>
                <label htmlFor="password" className="text-sm">
                  Password
                </label>
                <Input
                  data-testid="password-input"
                  type="password"
                  className="mt-2 border border-input"
                  {...register("password", { required: true })}
                />
                {errors.password && (
                  <span className="text-xxs text-red-500">
                    {errors.password.message}
                  </span>
                )}
              </div>
              <div className="flex justify-end">
                <Link
                  className="text-right text-xs text-violet-500"
                  href="/auth/forgot-password"
                >
                  Forgot Password
                </Link>
              </div>

              <Button type="submit" data-testid="login" disabled={loading}>
                {loading ? (
                  <Loader2
                    className="mr-2 h-4 w-4 animate-spin"
                    color="#803FE8"
                  />
                ) : (
                  <span>Log In</span>
                )}
              </Button>
            </form>

            <div className="my-4 flex items-center gap-4">
              <hr className="flex-grow border-athens-gray-100" />
              <span className="text-xs">or login with</span>
              <hr className="flex-grow border-athens-gray-100" />
            </div>
            <Button
              variant={"google"}
              // eslint-disable-next-line @typescript-eslint/no-misused-promises
              onClick={async () =>
                await signIn("google", {
                  callbackUrl: "/dashboard",
                })
              }
              className="text-xs font-medium text-athens-gray-900"
            >
              <Image
                height={4}
                width={4}
                className="mr-3 h-4 w-4"
                alt="Google Button"
                src="https://upload.wikimedia.org/wikipedia/commons/thumb/5/53/Google_%22G%22_Logo.svg/512px-Google_%22G%22_Logo.svg.png"
              />
              Continue With Google
            </Button>
            <p className="mt-8 whitespace-pre text-center text-xs font-medium">
              Don&rsquo;t have an account?
              <Link
                data-testid="create-account"
                className="whitespace-pre text-xs text-violet-500"
                href="/auth/signup"
              >
                &nbsp;Create Now
              </Link>
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default Login;
