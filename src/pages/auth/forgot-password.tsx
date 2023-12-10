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
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from "next/router";
import { useState } from "react";
import { getSession } from "next-auth/react";

const loginSchema = z.object({
  email: z.string().email().min(5),
});

type LoginSchema = z.infer<typeof loginSchema>;

const ForgotPassword: NextPage = () => {
  const {
    register,
    watch,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginSchema>({
    // @typescript-eslint/no-unsafe-assignment
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    resolver: zodResolver(loginSchema),
  });
  const { toast } = useToast();
  const [emailSent, setEmailSent] = useState<boolean>(false);
  const router = useRouter();

  const { mutate: forgotPassword, isLoading } =
    api.auth.forgotPassword.useMutation({
      onSuccess: () => {
        // await router.push("/auth/login");
        setEmailSent(true);
      },
      onError: (e) => {
        const errorMessage = e.data?.zodError?.fieldErrors.content;
        if (errorMessage && errorMessage[0]) {
          // toast.error(errorMessage[0]);
        } else {
          // toast.error("Failed to create! Please try again later.");
          const regex = /:\s*(.*)/;
          const match = regex.exec(e.data?.stack as string);
          const message = match ? match[1] : "An error occurred";
          toast({
            description: message,
          });
        }
      },
    });

  const onSubmit = (data: LoginSchema) => {
    forgotPassword(data);
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
            className="h-full w-full object-cover"
          />
        </div>
        <div className="flex flex-1 items-center justify-center font-satoshi">
          <div className="w-full max-w-md px-4 py-4 md:max-w-sm">
            <div className="mx-auto flex items-center justify-center font-display text-3xl font-bold tracking-widest">
              <img src="/logo.png" className="w-16 pr-4" alt="logo" />
              <span className="text-violet-600">Duit</span>Hive
            </div>
            {emailSent ? (
              <>
                <Image
                  height={400}
                  width={400}
                  className="mt-10"
                  alt="Email Sent"
                  src="/auth/email-sent.png"
                />
                <p className="mt-3 text-center font-satoshi text-sm">
                  An email has been sent to{" "}
                  <span className="font-medium">{watch("email")}</span>
                </p>
                <Button
                  className="mt-10 w-full"
                  onClick={() => void router.push("/auth/login")}
                >
                  Back to login
                </Button>
              </>
            ) : (
              <>
                <h2 className="my-4 font-display text-2xl tracking-wide">
                  Forgot Password
                </h2>
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
                  <Button type="submit" disabled={isLoading} className="mt-10">
                    {isLoading ? (
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
              </>
            )}
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

export default ForgotPassword;
