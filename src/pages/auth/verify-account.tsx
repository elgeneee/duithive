import { type NextPage } from "next";
import Head from "next/head";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { api } from "@/utils/api";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/router";
import { Loader2 } from "lucide-react";

let currentOTPIndex = 0;

const VerifyAccount: NextPage = () => {
  const router = useRouter();
  const { email } = router.query;

  const [otp, setOtp] = useState<string[]>(new Array(4).fill(""));
  const [activeOTPIndex, setActiveOTPIndex] = useState<number>(0);

  const inputRef = useRef<HTMLInputElement>(null);
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    verifyEmail({ email: email as string, otp: otp.join("") });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const newOTP: string[] = [...otp];
    const value = e.target.value;

    // Discard non-numeric characters
    const sanitizedValue = value.replace(/[^0-9]/g, "");

    // Update the value of the current input box
    newOTP[currentOTPIndex] = sanitizedValue.substring(0, 1);

    // Move the cursor to the next input box or back to the first input
    if (sanitizedValue.length === 1 && currentOTPIndex < otp.length - 1) {
      setActiveOTPIndex(currentOTPIndex + 1);
    } else if (sanitizedValue.length === 0 && currentOTPIndex > 0) {
      setActiveOTPIndex(currentOTPIndex - 1);
    }

    // Update the input value to reflect the sanitized value
    e.target.value = sanitizedValue.substring(0, 1);

    setOtp(newOTP);
  };

  const handleOTPKeyDown = (
    { key }: React.KeyboardEvent<HTMLInputElement>,
    index: number
  ) => {
    currentOTPIndex = index;
    if (key === "Backspace") {
      inputRef.current?.focus();
      const newOtp = otp;
      newOtp[index] = "";
      setOtp(newOtp);
      setActiveOTPIndex(currentOTPIndex - 1);
    }
  };

  useEffect(() => {
    inputRef.current?.focus();
  }, [activeOTPIndex]);

  useEffect(() => {
    const handlePaste = (event: ClipboardEvent) => {
      const clipboardData = event.clipboardData;

      if (clipboardData) {
        const otpClipboard = clipboardData
          .getData("text")
          .replace(/[^0-9]/g, "")
          .slice(0, 4)
          .split("");

        const newOtp = new Array(4).fill("");
        for (let i = 0; i < otpClipboard.length; i++) {
          newOtp[i] = otpClipboard[i];
        }
        setActiveOTPIndex(otpClipboard.length);
        setOtp(newOtp);
      }
    };
    window.addEventListener("paste", handlePaste);
    return () => {
      window.removeEventListener("paste", handlePaste);
    };
  });

  const { mutate: verifyEmail, isLoading: loading } =
    api.auth.verifyEmail.useMutation({
      onSuccess: async () => {
        // setInput("");
        setActiveOTPIndex(0);
        setOtp(new Array(4).fill(""));
        await router.push("/auth/login");
      },
      onError: (e) => {
        const errorMessage = e.data?.zodError?.fieldErrors.content;

        if (errorMessage && errorMessage[0]) {
          // toast.error(errorMessage[0]);
        } else {
          // toast.error("Failed to create! Please try again later.");
        }
        setActiveOTPIndex(0);
        setOtp(new Array(4).fill(""));
      },
    });

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
            <h2 className="my-4 text-center font-display text-2xl font-semibold tracking-wide">
              Verify Account
            </h2>
            <p className="text-center text-xs font-medium text-athens-gray-500">
              We&apos;ve sent a code to{" "}
              <span className="font-semibold">{email}</span>
            </p>
            <form
              className="mt-4 flex flex-col gap-4"
              // eslint-disable-next-line @typescript-eslint/no-misused-promises
              onSubmit={handleSubmit}
            >
              <div className="mx-auto flex space-x-6">
                {otp.map((_, index) => {
                  return (
                    <Input
                      ref={index === activeOTPIndex ? inputRef : null}
                      key={index}
                      type="text"
                      onChange={handleChange}
                      onKeyDown={(e) => handleOTPKeyDown(e, index)}
                      pattern="[0-9]*"
                      className="h-14 w-12 text-center text-lg font-bold"
                      value={otp[index]}
                    />
                  );
                })}
              </div>
              <Button type="submit" disabled={loading} className="mt-6">
                {loading ? (
                  <Loader2
                    className="mr-2 h-4 w-4 animate-spin"
                    color="#803FE8"
                  />
                ) : (
                  <span>Verify</span>
                )}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default VerifyAccount;
