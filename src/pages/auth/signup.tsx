import { type NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { api } from "@/utils/api";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/router";
import { Loader2 } from "lucide-react";
import { signIn } from "next-auth/react";

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
        await router.push(
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          `/auth/verify-account?email=${data.user.email!.replaceAll(
            "@",
            "%40"
          )}`
        );
      },
      onError: (e) => {
        const errorMessage = e.data?.zodError?.fieldErrors.content;

        if (errorMessage && errorMessage[0]) {
          // toast.error(errorMessage[0]);
        } else {
          // toast.error("Failed to create! Please try again later.");
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
            <h2 className="my-4 font-display text-2xl font-semibold tracking-wide">
              Sign Up
            </h2>
            <p className="mb-4 font-satoshi text-lg font-semibold">
              Create an account
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
                  className="mt-2"
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
                  className="mt-2"
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
                  className="mt-2"
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
                  className="mt-2"
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
                  <Loader2
                    className="mr-2 h-4 w-4 animate-spin"
                    color="#803FE8"
                  />
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

export default SignUp;
