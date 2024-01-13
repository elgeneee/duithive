/* eslint-disable @typescript-eslint/no-unsafe-call */
import { type NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import { signIn, getSession } from "next-auth/react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
// import { api } from "@/utils/api";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/components/ui/use-toast";
import { useState, useEffect } from "react";

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
  const searchParams = useSearchParams();

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

  useEffect(() => {
    if (toast && searchParams.get("error") === "OAuthAccountNotLinked") {
      setTimeout(() => {
        toast({
          variant: "error",
          status: "error",
          title: "Oops! This account is already registered but not with Google",
        });
      }, 100);
    }
  }, [searchParams, toast]);

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
            src="/login-image.webp"
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
              <svg
                xmlns="http://www.w3.org/2000/svg"
                x="0px"
                y="0px"
                width="20"
                height="20"
                viewBox="0 0 48 48"
              >
                <path
                  fill="#fbc02d"
                  d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12	s5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20	s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"
                ></path>
                <path
                  fill="#e53935"
                  d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039	l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"
                ></path>
                <path
                  fill="#4caf50"
                  d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36	c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"
                ></path>
                <path
                  fill="#1565c0"
                  d="M43.611,20.083L43.595,20L42,20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571	c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"
                ></path>
              </svg>
              <span className="pl-2">Continue With Google</span>
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

export default Login;
