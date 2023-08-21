import { type NextPage } from "next";
import { getSession, useSession } from "next-auth/react";
import AppLayout from "@/components/AppLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api } from "@/utils/api";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
// import type { inferRouterInputs, inferRouterOutputs } from "@trpc/server";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Check,
  ChevronsUpDown,
  UploadCloud,
  Trash,
  Trash2,
  Loader2,
} from "lucide-react";
import { currencies } from "@/store/currency";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavStore } from "@/store/navStore";
import { useToast } from "@/components/ui/use-toast";
import { signOut } from "next-auth/react";

const userSettingsSchema = z.object({
  username: z
    .string()
    .trim()
    .min(5, { message: "Username must be at least 5 characters" }),
});

const deleteAccountSchema = z.object({
  email: z.string().email().min(5),
});

const Settings: NextPage = () => {
  const { data: session } = useSession();
  const { setImgUrl, setUsername } = useNavStore();
  const { toast } = useToast();
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<z.infer<typeof userSettingsSchema>>({
    resolver: zodResolver(userSettingsSchema),
  });

  const {
    register: registerDeleteAccount,
    handleSubmit: handleDeleteAccountSubmit,
    setError: setDeleteAccountError,
    formState: { errors: deleteAccountErrors },
  } = useForm<z.infer<typeof deleteAccountSchema>>({
    resolver: zodResolver(deleteAccountSchema),
  });
  const ctx = api.useContext();
  const [currencyOpen, setCurrencyOpen] = useState<boolean>(false);
  const [currencyValue, setCurrencyValue] = useState<string>("");
  const [emailValue, setEmailValue] = useState<string>("");
  //drag-and-drop image
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [imageName, setImageName] = useState<string>("");
  //user email

  const [fileSizeTooBig, setFileSizeTooBig] = useState<boolean>(false);
  const [fileIsNotImage, setFileIsNotImage] = useState<boolean>(false);

  //
  const [notificationAlert, setNotificationAlert] = useState<boolean>();
  const today = new Date();
  const formattedDate = today.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "2-digit",
  });

  const { data: userSettings } = api.user.getUserSettings.useQuery({
    email: session?.user?.email as string,
  });

  const { mutate: editProfile } = api.user.editProfile.useMutation({
    onSuccess: (data) => {
      reset;
      //zustand
      setUsername(data?.name as string);
      setImgUrl(data?.image as string);

      //localStates
      setProfileImage(null);
      setImageName("");
      void ctx.user.getUserSettings.invalidate({
        email: session?.user?.email as string,
      });
      toast({
        variant: "success",
        status: "success",
        title: "Profile updated successfully!",
      });
    },
    onError: (e) => {
      const errorMessage = e.data;
      if (errorMessage) {
        toast({
          variant: "error",
          status: "error",
          title: errorMessage.code,
        });
      }
    },
  });

  const { mutate: editNotification, isLoading: isEditNotificationLoading } =
    api.user.editNotification.useMutation({
      onSuccess: () => {
        void ctx.user.getUserSettings.invalidate({
          email: session?.user?.email as string,
        });
        toast({
          variant: "success",
          status: "success",
          title: "Profile updated successfully!",
        });
      },
      onError: (e) => {
        const errorMessage = e.data;
        if (errorMessage) {
          toast({
            variant: "error",
            status: "error",
            title: errorMessage.code,
          });
        }
      },
    });

  const { mutate: deleteAccount, isLoading: isDeleteAccountLoading } =
    api.user.deleteAccount.useMutation({
      onSuccess: () => {
        //toast
        void ctx.user.getUserSettings.invalidate({
          email: session?.user?.email as string,
        });
      },
      onError: (e) => {
        const errorMessage = e.data?.zodError?.fieldErrors.content;
        console.log(e);
        if (errorMessage && errorMessage[0]) {
          // toast.error(errorMessage[0]);
        } else {
          // toast.error("Failed to create! Please try again later.");
        }
      },
    });

  useEffect(() => {
    if (userSettings) {
      setValue("username", userSettings?.name as string);
      setCurrencyValue(userSettings.currency?.name.toLowerCase() as string);
      setEmailValue(userSettings.email as string);
      setNotificationAlert(userSettings.notification);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userSettings]);

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    setFileSizeTooBig(false);
    setFileIsNotImage(false);
    setProfileImage(null);
    const file = e.dataTransfer.files && e.dataTransfer.files[0];
    const validImageType = ["image/jpeg", "image/png"];
    if (file) {
      if (file.size / 1024 / 1024 > 5) {
        setFileSizeTooBig(true);
        setProfileImage(null);
        setImageName("");
      } else if (!validImageType.includes(file.type)) {
        setFileIsNotImage(true);
        setProfileImage(null);
        setImageName("");
      } else {
        const reader = new FileReader();
        reader.onload = (e) => {
          setProfileImage(file);
          setImageName(e.target?.result as string);
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const deleteImage = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setProfileImage(null);
    setImageName("");
  };

  const onChangeImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileSizeTooBig(false);
    setFileIsNotImage(false);
    setProfileImage(null);
    const validImageType = ["image/jpeg", "image/png"];
    const file = e.currentTarget.files && e.currentTarget.files[0];
    if (file) {
      if (file.size / 1024 / 1024 > 5) {
        setFileSizeTooBig(true);
        setProfileImage(null);
        setImageName("");
      } else if (!validImageType.includes(file.type)) {
        setFileIsNotImage(true);
        setProfileImage(null);
        setImageName("");
      } else {
        const reader = new FileReader();
        reader.onload = (e) => {
          setProfileImage(file);
          setImageName(e.target?.result as string);
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const delay = (ms: number | undefined) =>
    new Promise((res) => setTimeout(res, ms));

  const onProfileSubmit = async (data: z.infer<typeof userSettingsSchema>) => {
    const currencyId: number =
      currencies.find((currency) => currency.value === currencyValue)?.id || 1;

    let imageUrl: string | null = null;

    if (profileImage) {
      try {
        const formData = new FormData();
        formData.append("file", profileImage);
        formData.append("upload_preset", "oxd8flh9");
        formData.append(
          "folder",
          `duithive/users/${userSettings?.email as string}/profile`
        );
        const cloudinaryUpload = await fetch(
          "https://api.cloudinary.com/v1_1/dlidl2li4/image/upload",
          {
            method: "POST",
            body: formData,
          }
        );

        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const cloudinaryResponse = await cloudinaryUpload.json();

        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
        imageUrl = cloudinaryResponse.secure_url;
      } catch (err) {
        console.log(err);
      }
    } else {
      await delay(500);
    }

    editProfile({
      username: data.username,
      email: emailValue,
      currencyId: currencyId,
      image: imageUrl,
    });
  };

  const onNotificationSubmit = () => {
    editNotification({
      email: emailValue,
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      notification: notificationAlert!,
    });
  };

  const onDeleteAccountSubmit = (data: z.infer<typeof deleteAccountSchema>) => {
    if (data.email !== emailValue) {
      setDeleteAccountError("email", {
        type: "custom",
        message: "Email do not match",
      });
    } else {
      deleteAccount(data);
      void signOut();
    }
  };

  return (
    <AppLayout>
      <main className="p-4">
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-athens-gray-300">{formattedDate}</p>
        <Tabs defaultValue="profile" className="mt-10 justify-start">
          <TabsList className="w-full grid-cols-2 justify-start border-b">
            <TabsTrigger value="profile" className="w-20 text-base">
              Profile
            </TabsTrigger>
            <TabsTrigger value="notifications" className=" w-36 text-base">
              Notifications
            </TabsTrigger>
          </TabsList>
          <TabsContent value="profile">
            {/* eslint-disable-next-line @typescript-eslint/no-misused-promises */}
            <form onSubmit={handleSubmit(onProfileSubmit)}>
              <div className="flex items-center justify-between">
                <div className="my-5">
                  <p className="font-semibold">Personal Info</p>
                  <p className="text-sm font-medium text-athens-gray-300">
                    Update your personal details here
                  </p>
                </div>
                <div className="flex space-x-3">
                  <Button
                    variant={"outline"}
                    className="border-violet-500 text-violet-500 hover:text-violet-600"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-32"
                  >
                    {isSubmitting ? (
                      <Loader2
                        className="mr-2 h-4 w-4 animate-spin"
                        color="#803FE8"
                      />
                    ) : (
                      <span>Save Changes</span>
                    )}
                  </Button>
                </div>
              </div>
              <hr />
              <div className="my-5 flex items-center justify-between">
                <div>
                  <p className="font-semibold">Username</p>
                </div>
                <div>
                  <Input
                    className="mt-2 w-[300px] border border-input bg-white hover:bg-accent hover:text-accent-foreground"
                    defaultValue={userSettings?.name as string}
                    {...register("username", { required: true })}
                  />
                  {errors.username && (
                    <span className="text-xxs text-red-500">
                      {errors.username.message}
                    </span>
                  )}
                </div>
              </div>
              <div className="my-5 flex items-center justify-between">
                <div>
                  <p className="font-semibold">Email</p>
                </div>
                <div>
                  <Input
                    className="mt-2 w-[300px] border border-input bg-white hover:bg-accent hover:text-accent-foreground"
                    disabled={true}
                    type="email"
                    value={emailValue}
                  />
                </div>
              </div>
              <div className="my-7 flex justify-between">
                <div>
                  <p className="font-semibold">Photo</p>
                </div>
                <div className="flex space-x-3">
                  <Avatar className="h-12 w-12 border border-athens-gray-200">
                    <AvatarImage src={userSettings?.image as string} />
                    <AvatarFallback className="bg-white">
                      {userSettings?.name?.substring(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <label
                      htmlFor="image-upload"
                      className={cn(
                        "group relative mx-auto flex aspect-square w-[300px] cursor-pointer flex-col items-center justify-center rounded-lg  border border-dashed  transition duration-100 hover:border-athens-gray-300",
                        dragActive
                          ? "border-athens-gray-300"
                          : "border-athens-gray-200"
                      )}
                    >
                      {profileImage && (
                        <button
                          type="button"
                          onClick={deleteImage}
                          disabled={isSubmitting}
                          className={cn(
                            "absolute right-3 top-3 z-[110] rounded-md p-1 transition-colors",
                            isSubmitting
                              ? " bg-black/50"
                              : "bg-black/50 hover:bg-black/60"
                          )}
                        >
                          <Trash2 color={"#ffffff"} size={18} />
                        </button>
                      )}
                      <div
                        onDragOver={handleDragOver}
                        onDragEnter={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        className="absolute z-40 aspect-video h-full w-full rounded-md  bg-white object-cover"
                      ></div>
                      <div
                        className={cn(
                          "absolute z-50 flex flex-col items-center justify-center text-center text-xs font-medium transition-all duration-100",
                          dragActive ? "text-gray-500/70" : "text-gray-400",
                          profileImage && "hidden"
                        )}
                      >
                        <UploadCloud
                          className={cn(
                            "mb-2 text-athens-gray-900 transition duration-100 group-hover:scale-110",
                            dragActive && "scale-110"
                          )}
                        />
                        <p className="font-semibold">
                          <span className="font-semibold text-athens-gray-900">
                            Click to upload
                          </span>{" "}
                          or drag & drop
                        </p>
                        <p>SVG, PNG or JPG</p>
                        <p>Accept image files only (Max at 5MB)</p>
                      </div>
                      {profileImage && (
                        //eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={imageName ? imageName : undefined}
                          alt="Preview"
                          className="z-[100] aspect-video h-full object-contain"
                        />
                      )}
                    </label>
                    <div className="z-30 mt-1 flex rounded-md shadow-lg">
                      <input
                        id="image-upload"
                        name="image"
                        type="file"
                        accept="image/*"
                        className="sr-only"
                        onChange={onChangeImage}
                      />
                    </div>
                    {fileSizeTooBig && (
                      <p className="text-xs text-red-500">
                        File size too big (less than 5MB)
                      </p>
                    )}
                    {fileIsNotImage && (
                      <p className="text-xs text-red-500">
                        File is not an image
                      </p>
                    )}
                  </div>

                  {/* drag-and-drop */}
                </div>
              </div>

              <div className="my-5 flex items-center justify-between">
                <div>
                  <p className="font-semibold">Currency</p>
                </div>
                <div className="flex space-x-3">
                  <Popover open={currencyOpen} onOpenChange={setCurrencyOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={currencyOpen}
                        className="w-[200px] justify-between bg-white"
                      >
                        {currencyValue
                          ? currencies.find(
                              (currency) => currency.value === currencyValue
                            )?.label
                          : "Select currency"}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[200px] p-0">
                      <Command>
                        <CommandInput placeholder="Search currency..." />
                        <CommandEmpty>No currency found.</CommandEmpty>
                        <CommandGroup>
                          {currencies.map((currency) => (
                            <CommandItem
                              key={currency.value}
                              onSelect={(currentValue) => {
                                setCurrencyValue(currentValue.slice(-3));
                                setCurrencyOpen(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  currencyValue == currency.value
                                    ? "opacity-100"
                                    : "opacity-0"
                                )}
                              />
                              <div className="flex w-full space-x-3">
                                <p className="w-1/3 text-center">
                                  {currency.symbol}
                                </p>
                                <p className="w-2/3">{currency.label}</p>
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </form>
            <hr />
            <div>
              <p className="mt-5 font-semibold text-red-500">Delete Account</p>
              <p className="text-xs">
                Once you delete your account, there is no going back. Please be
                certain.
              </p>
              <Dialog>
                <DialogTrigger asChild>
                  <Button
                    variant="destructive"
                    className="mt-2 flex items-center space-x-2 px-8"
                  >
                    <Trash size={18} />
                    <span>Delete</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <form
                    // eslint-disable-next-line @typescript-eslint/no-misused-promises
                    onSubmit={handleDeleteAccountSubmit(onDeleteAccountSubmit)}
                  >
                    <DialogHeader>
                      <DialogTitle>Are you sure?</DialogTitle>
                      <DialogDescription>
                        This action cannot be undone. This will permanently
                        delete all your expenses, incomes, and budgets.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                      <div className="space-y-3">
                        <p className="text-xs font-medium">
                          Please type{" "}
                          <span className="mx-1 rounded-md bg-athens-gray-100 p-1 font-consola font-semibold">
                            {userSettings?.email}
                          </span>{" "}
                          to confirm
                        </p>
                        <Input
                          id="email"
                          {...registerDeleteAccount("email", {
                            required: true,
                          })}
                        />
                        {deleteAccountErrors.email && (
                          <span className="text-xxs text-red-500">
                            {deleteAccountErrors.email.message}
                          </span>
                        )}
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="secondary">Cancel</Button>
                      <Button
                        type="submit"
                        variant="destructive"
                        disabled={isDeleteAccountLoading}
                        className="w-24"
                      >
                        {isDeleteAccountLoading ? (
                          <Loader2
                            className="h-4 w-4 animate-spin"
                            color="#EF4444"
                          />
                        ) : (
                          <span>Confirm</span>
                        )}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </TabsContent>
          <TabsContent value="notifications">
            <div className="flex items-center justify-between">
              <div className="my-5">
                <p className="font-semibold">Notification Settings</p>
                <p className="text-sm font-medium text-athens-gray-300">
                  Update your notification settings here
                </p>
              </div>
              <div className="flex space-x-3">
                <Button
                  variant={"outline"}
                  className="border-violet-500 text-violet-500 hover:text-violet-600"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isEditNotificationLoading}
                  className="w-32"
                  onClick={onNotificationSubmit}
                >
                  {isEditNotificationLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" color="#803FE8" />
                  ) : (
                    <span>Save Changes</span>
                  )}
                </Button>
              </div>
            </div>
            <hr />
            <div className="my-5 flex items-center justify-between rounded-lg border border-athens-gray-100 bg-white px-3 py-3">
              <div>
                <p className="font-semibold">Alert emails</p>
                <p className="text-sm font-semibold text-athens-gray-300">
                  Receive emails about budget status
                </p>
              </div>
              <div>
                <Switch
                  checked={notificationAlert}
                  onCheckedChange={setNotificationAlert}
                  id="notification"
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </AppLayout>
  );
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getServerSideProps(context: any) {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  const session = await getSession(context);
  if (!session) {
    return {
      redirect: {
        destination: "/auth/login",
        permanent: false,
      },
    };
  }

  return {
    props: { session },
  };
}

export default Settings;
