/* eslint-disable @typescript-eslint/no-floating-promises */
import { type NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { api } from "@/utils/api";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/router";
import { signIn, getSession } from "next-auth/react";
import { useToast } from "@/components/ui/use-toast";

const signupSchema = z
  .object({
    email: z.string().trim().email().min(5),
    username: z
      .string()
      .trim()
      .min(5, { message: "Username must be at least 5 characters" }),
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

type SignUpSchema = z.infer<typeof signupSchema>;

const SignUp: NextPage = () => {
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignUpSchema>({
    // @typescript-eslint/no-unsafe-assignment
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
    resolver: zodResolver(signupSchema),
  });
  const router = useRouter();
  const onSubmit = (data: SignUpSchema) => {
    // eslint-disable-next-line @typescript-eslint/await-thenable
    registerUser(data);
  };

  const { mutate: registerUser, isLoading: loading } =
    api.auth.register.useMutation({
      onSuccess: async (data) => {
        if (data?.user?.email) {
          await router.push(
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            `/auth/verify-account?email=${data.user.email.replaceAll(
              "@",
              "%40"
            )}`
          );
        }
      },
      onError: (e) => {
        const errorMessage = e.data?.zodError?.fieldErrors.content;
        if (errorMessage && errorMessage[0]) {
          toast({
            variant: "error",
            status: "error",
            title: errorMessage[0] || "An error occurred",
          });
        } else {
          toast({
            variant: "error",
            status: "error",
            title: e.message || "An error occurred",
          });
        }
      },
    });

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
            <h2 className="my-4 font-display text-2xl tracking-wide">
              Sign Up
            </h2>
            <p className="mb-4 font-satoshi text-lg">Create an account</p>
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
                <label htmlFor="username" className="text-sm">
                  Username
                </label>
                <Input
                  type="username"
                  className="mt-2 border border-input"
                  {...register("username", { required: true })}
                />
                {errors.username && (
                  <span className="text-xxs text-red-500">
                    {errors.username.message}
                  </span>
                )}
              </div>
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
              <Button type="submit" disabled={loading} className="mt-6">
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
                  <span>Create Account</span>
                )}
              </Button>
            </form>

            <div className="my-4 flex items-center gap-4">
              <hr className="flex-grow border-athens-gray-100" />
              <span className="text-xs">sign up or</span>
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
              Have an account?
              <Link
                className="whitespace-pre text-xs text-violet-500"
                href="/auth/login"
              >
                &nbsp;Log in
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

export default SignUp;
