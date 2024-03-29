/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { type NextPage } from "next";
import { getSession, useSession } from "next-auth/react";
import AppLayout from "@/components/AppLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api } from "@/utils/api";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DndContext,
  DragOverlay,
  type DragStartEvent,
  type DragEndEvent,
  TouchSensor,
  MouseSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
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
import { SortableItem } from "@/components/SortableItem";
import {
  items1 as items1Order,
  items2 as items2Order,
  items3 as items3Order,
} from "@/store/dndStore";
import { icons, categories } from "@/store/category";

const userSettingsSchema = z.object({
  username: z
    .string()
    .trim()
    .min(5, { message: "Username must be at least 5 characters" }),
  favCat1: z
    .object({
      value: z.string().nullable(),
      label: z.string().nullable(),
      iconId: z.number().nullable(),
    })
    .nullable(),
  favCat2: z
    .object({
      value: z.string().nullable(),
      label: z.string().nullable(),
      iconId: z.number().nullable(),
    })
    .nullable(),
  favCat3: z
    .object({
      value: z.string().nullable(),
      label: z.string().nullable(),
      iconId: z.number().nullable(),
    })
    .nullable(),
});

const deleteAccountSchema = z.object({
  email: z.string().email().min(5),
});

type TItem = {
  id: string;
  name: string;
  icon: JSX.Element;
};

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
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);

  //drag-and-drop image
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [imageName, setImageName] = useState<string>("");
  const [fileSizeTooBig, setFileSizeTooBig] = useState<boolean>(false);
  const [fileIsNotImage, setFileIsNotImage] = useState<boolean>(false);

  const [notificationAlert, setNotificationAlert] = useState<boolean>();
  const [monthlyReport, setMonthlyReport] = useState<boolean>();

  //dndkit
  const [isDashboardLoading, setIsDashboardLoading] = useState<boolean>(false);
  const [items1, setItems1] = useState<TItem[]>();
  const [items2, setItems2] = useState<TItem[]>();
  const [items3, setItems3] = useState<TItem[]>();
  const [activeItem1, setActiveItem1] = useState<TItem>();
  const [activeItem2, setActiveItem2] = useState<TItem>();
  const [activeItem3, setActiveItem3] = useState<TItem>();

  //favoriteCategories
  const [favCategory1, setFavCategory1] = useState<boolean>(false);
  const [favCat1Value, setFavCat1Value] = useState<string>("");
  const [favCat1IconId, setFavCat1IconId] = useState<number | null>(null);
  const [favCat1DispIconId, setFavCat1DispIconId] = useState<number>(8);
  const [favCat1DispValue, setFavCat1DispValue] = useState<string>("");

  const [favCategory2, setFavCategory2] = useState<boolean>(false);
  const [favCat2Value, setFavCat2Value] = useState<string>("");
  const [favCat2IconId, setFavCat2IconId] = useState<number | null>(null);
  const [favCat2DispIconId, setFavCat2DispIconId] = useState<number>(8);
  const [favCat2DispValue, setFavCat2DispValue] = useState<string>("");

  const [favCategory3, setFavCategory3] = useState<boolean>(false);
  const [favCat3Value, setFavCat3Value] = useState<string>("");
  const [favCat3IconId, setFavCat3IconId] = useState<number | null>(null);
  const [favCat3DispIconId, setFavCat3DispIconId] = useState<number>(8);
  const [favCat3DispValue, setFavCat3DispValue] = useState<string>("");

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
      toast({
        variant: "error",
        status: "error",
        title: e.message,
      });
    },
  });

  const { mutate: resetFav1Category, isLoading: isResetFav1CategoryLoading } =
    api.user.resetFav1Category.useMutation({
      onSuccess: () => {
        setFavCat1Value("");
        setFavCat1IconId(null);

        void ctx.user.getUserSettings.invalidate({
          email: session?.user?.email as string,
        });

        toast({
          variant: "success",
          status: "success",
          title: "Category 1 reseted successfully!",
        });
      },
    });

  const { mutate: resetFav2Category, isLoading: isResetFav2CategoryLoading } =
    api.user.resetFav2Category.useMutation({
      onSuccess: () => {
        setFavCat2Value("");
        setFavCat2IconId(null);

        void ctx.user.getUserSettings.invalidate({
          email: session?.user?.email as string,
        });

        toast({
          variant: "success",
          status: "success",
          title: "Category 2 reseted successfully!",
        });
      },
    });

  const { mutate: resetFav3Category, isLoading: isResetFav3CategoryLoading } =
    api.user.resetFav3Category.useMutation({
      onSuccess: () => {
        setFavCat3Value("");
        setFavCat3IconId(null);

        void ctx.user.getUserSettings.invalidate({
          email: session?.user?.email as string,
        });

        toast({
          variant: "success",
          status: "success",
          title: "Category 3 reseted successfully!",
        });
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
        toast({
          variant: "error",
          status: "error",
          title: e.message,
        });
      },
    });

  const { mutate: deleteAccount, isLoading: isDeleteAccountLoading } =
    api.user.deleteAccount.useMutation({
      onSuccess: () => {
        void ctx.user.getUserSettings.invalidate({
          email: session?.user?.email as string,
        });
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

  useEffect(() => {
    const dashboardOrdering = localStorage.getItem("dashboardOrdering");

    if (dashboardOrdering) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const dashboardOrderingJSON = JSON.parse(dashboardOrdering);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      if (dashboardOrderingJSON?.[1]?.[0]?.id == "1") {
        setItems1(items1Order);
      } else {
        setItems1([...items1Order].reverse());
      }

      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      if (dashboardOrderingJSON?.[2]?.[0]?.id == "3") {
        setItems2(items2Order);
      } else {
        setItems2([...items2Order].reverse());
      }

      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      if (dashboardOrderingJSON?.[3]?.[0]?.id == "5") {
        setItems3(items3Order);
      } else {
        setItems3([...items3Order].reverse());
      }
    } else {
      setItems1(items1Order);
      setItems2(items2Order);
      setItems3(items3Order);
    }
  }, []);

  useEffect(() => {
    if (userSettings) {
      setValue("username", userSettings?.name as string);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      setCurrencyValue(userSettings.currency?.name.toLowerCase() as string);
      setEmailValue(userSettings.email as string);
      setNotificationAlert(userSettings.notification);
      setMonthlyReport(userSettings.monthlyReport);
      setValue(
        "favCat1",
        userSettings.favoriteCategory1
          ? {
              value: userSettings.favoriteCategory1?.name,
              label: userSettings.favoriteCategory1?.name,
              iconId: userSettings.favoriteCategory1?.iconId,
            }
          : null
      );
      setValue(
        "favCat2",
        userSettings.favoriteCategory2
          ? {
              value: userSettings.favoriteCategory2?.name,
              label: userSettings.favoriteCategory2?.name,
              iconId: userSettings.favoriteCategory2?.iconId,
            }
          : null
      );
      setValue(
        "favCat3",
        userSettings.favoriteCategory3
          ? {
              value: userSettings.favoriteCategory3?.name,
              label: userSettings.favoriteCategory3?.name,
              iconId: userSettings.favoriteCategory3?.iconId,
            }
          : null
      );
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
      favCat1: data.favCat1,
      favCat2: data.favCat2,
      favCat3: data.favCat3,
    });
  };

  const onNotificationSubmit = () => {
    editNotification({
      email: emailValue,
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      notification: notificationAlert!,
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      monthlyReport: monthlyReport!,
    });
  };

  const resetDashboard = () => {
    const updatedItems1 = items1Order.map((item) => {
      return { id: item?.id, name: item.name };
    });
    const updatedItems2 = items2Order.map((item) => {
      return { id: item.id, name: item.name };
    });
    const updatedItems3 = items3Order.map((item) => {
      return { id: item.id, name: item.name };
    });

    localStorage.setItem(
      "dashboardOrdering",
      JSON.stringify({
        1: updatedItems1,
        2: updatedItems2,
        3: updatedItems3,
      })
    );

    setItems1(items1Order);
    setItems2(items2Order);
    setItems3(items3Order);

    toast({
      variant: "success",
      status: "success",
      title: "Dashboard reset successfully!",
    });
  };

  const onDashboardSubmit = async () => {
    setIsDashboardLoading(true);
    await delay(300);
    if (items1 && items2 && items3) {
      const updatedItems1 = items1.map((item) => {
        return { id: item?.id, name: item.name };
      });
      const updatedItems2 = items2.map((item) => {
        return { id: item.id, name: item.name };
      });
      const updatedItems3 = items3.map((item) => {
        return { id: item.id, name: item.name };
      });

      localStorage.setItem(
        "dashboardOrdering",
        JSON.stringify({
          1: updatedItems1,
          2: updatedItems2,
          3: updatedItems3,
        })
      );
    }
    setIsDashboardLoading(false);
    toast({
      variant: "success",
      status: "success",
      title: "Dashboard is arranged!",
    });
  };

  const onDeleteAccountSubmit = (data: z.infer<typeof deleteAccountSchema>) => {
    if (data.email !== emailValue) {
      setDeleteAccountError("email", {
        type: "custom",
        message: "Emails do not match",
      });
    } else {
      deleteAccount(data);
      void signOut();
    }
  };

  const sensors = useSensors(useSensor(MouseSensor), useSensor(TouchSensor));

  const handleDragStart1 = (event: DragStartEvent) => {
    const { active } = event;
    if (items1) {
      setActiveItem1(items1.find((item) => item.id === active.id));
    }
  };

  const handleDragStart2 = (event: DragStartEvent) => {
    const { active } = event;
    if (items2) {
      setActiveItem2(items2.find((item) => item.id === active.id));
    }
  };

  const handleDragStart3 = (event: DragStartEvent) => {
    const { active } = event;
    if (items3) {
      setActiveItem3(items3.find((item) => item.id === active.id));
    }
  };

  const handleDragEnd1 = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    if (items1) {
      const activeItem = items1.find((item) => item.id === active.id);
      const overItem = items1.find((item) => item.id === over.id);

      if (!activeItem || !overItem) {
        return;
      }

      const activeIndex = items1.findIndex((item) => item.id === active.id);
      const overIndex = items1.findIndex((item) => item.id === over.id);

      if (activeIndex !== overIndex) {
        setItems1((prev) =>
          arrayMove<TItem>(prev ? prev : [], activeIndex, overIndex)
        );
      }
      setActiveItem1(undefined);
    }
  };

  const handleDragEnd2 = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    if (items2) {
      const activeItem = items2.find((item) => item.id === active.id);
      const overItem = items2.find((item) => item.id === over.id);

      if (!activeItem || !overItem) {
        return;
      }

      const activeIndex = items2.findIndex((item) => item.id === active.id);
      const overIndex = items2.findIndex((item) => item.id === over.id);

      if (activeIndex !== overIndex) {
        setItems2((prev) =>
          arrayMove<TItem>(prev ? prev : [], activeIndex, overIndex)
        );
      }
      setActiveItem2(undefined);
    }
  };

  const handleDragEnd3 = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    if (items3) {
      const activeItem = items3.find((item) => item.id === active.id);
      const overItem = items3.find((item) => item.id === over.id);

      if (!activeItem || !overItem) {
        return;
      }

      const activeIndex = items3.findIndex((item) => item.id === active.id);
      const overIndex = items3.findIndex((item) => item.id === over.id);

      if (activeIndex !== overIndex) {
        setItems3((prev) =>
          arrayMove<TItem>(prev ? prev : [], activeIndex, overIndex)
        );
      }
      setActiveItem3(undefined);
    }
  };

  const handleDragCancel1 = () => {
    setActiveItem1(undefined);
  };

  const handleDragCancel2 = () => {
    setActiveItem2(undefined);
  };

  const handleDragCancel3 = () => {
    setActiveItem3(undefined);
  };

  //favorite categories
  const handleFav1InputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFavCat1DispValue(e.target.value);
  };

  const handleFav2InputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFavCat2DispValue(e.target.value);
  };

  const handleFav3InputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFavCat3DispValue(e.target.value);
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
            <TabsTrigger value="notifications" className="w-32 text-base">
              Notifications
            </TabsTrigger>
            <TabsTrigger value="dashboard" className="w-32 text-base">
              Dashboard
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
                <div className="flex flex-col space-x-0 space-y-2 sm:flex-row sm:space-x-3 sm:space-y-0">
                  {/* <Button
                    variant={"outline"}
                    className="border-violet-500 text-violet-500 hover:text-violet-600"
                  >
                    Cancel
                  </Button> */}
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-32"
                  >
                    {isSubmitting ? (
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
                      <span>Save Changes</span>
                    )}
                  </Button>
                </div>
              </div>
              <hr />
              <div className="my-5 flex flex-col items-start sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-semibold">Username</p>
                </div>
                <div className="w-full sm:w-[300px]">
                  <Input
                    className="mt-2 border border-input bg-white hover:bg-accent hover:text-accent-foreground"
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
              <div className="my-5 flex flex-col items-start sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-semibold">Email</p>
                </div>
                <div className="w-full sm:w-[300px]">
                  <Input
                    className="mt-2 border border-input bg-white hover:bg-accent hover:text-accent-foreground"
                    disabled={true}
                    type="email"
                    value={emailValue}
                  />
                </div>
              </div>
              <div className="my-7 flex flex-col items-start justify-between sm:flex-row">
                <div>
                  <p className="font-semibold">Photo</p>
                </div>
                <div className="flex w-full sm:w-auto  sm:space-x-2">
                  <Avatar className="hidden h-12 w-12 border border-athens-gray-200 sm:block">
                    <AvatarImage src={userSettings?.image as string} />
                    <AvatarFallback className="bg-white">
                      {userSettings?.name?.substring(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  {/* <div className="w-full h-96 bg-black">s</div> */}
                  <div className="mt-2 w-full sm:mt-0">
                    <label
                      htmlFor="image-upload"
                      className={cn(
                        "group relative flex aspect-square w-full cursor-pointer flex-col items-center justify-center rounded-lg border  border-dashed transition  duration-100 hover:border-athens-gray-300 sm:w-[300px]",
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
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="#ffffff"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="h-5 w-5"
                          >
                            <path d="M3 6h18" />
                            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                            <line x1="10" x2="10" y1="11" y2="17" />
                            <line x1="14" x2="14" y1="11" y2="17" />
                          </svg>
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
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className={cn(
                            "mb-2 text-athens-gray-900 transition duration-100 group-hover:scale-110",
                            dragActive && "scale-110"
                          )}
                        >
                          <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" />
                          <path d="M12 12v9" />
                          <path d="m16 16-4-4-4 4" />
                        </svg>
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

              <div className="my-5 flex flex-col items-start justify-between sm:flex-row sm:items-center">
                <div>
                  <p className="font-semibold">Currency</p>
                </div>
                <div className="mt-2 w-full sm:mt-0 sm:w-[200px]">
                  <Popover open={currencyOpen} onOpenChange={setCurrencyOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={currencyOpen}
                        className="flex w-full bg-white sm:w-[200px]"
                      >
                        {currencyValue
                          ? currencies.find(
                              (currency) => currency.value === currencyValue
                            )?.label
                          : "Select currency"}
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="ml-2 h-4 w-4 shrink-0 opacity-50"
                        >
                          <path d="m7 15 5 5 5-5" />
                          <path d="m7 9 5-5 5 5" />
                        </svg>
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
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="24"
                                height="24"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  currencyValue === currency.value
                                    ? "opacity-100"
                                    : "opacity-0"
                                )}
                              >
                                <path d="M20 6 9 17l-5-5" />
                              </svg>
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
              <hr />
              <div className="my-5">
                <p className="font-semibold">Favorite Custom Categories</p>
                <p className="text-sm font-medium text-athens-gray-300">
                  Set your favorite categories for quick selection in the future
                </p>
                <div className="mt-5 rounded-md border border-athens-gray-100 bg-white p-4">
                  <p className="text-sm font-medium">Category 1</p>
                  <div className="mb-5 mt-2 flex items-center justify-between rounded-md border border-athens-gray-100 p-2">
                    <div
                      className={cn(
                        "cursor-pointer rounded-md",
                        favCat1IconId || userSettings?.favoriteCategory1?.iconId
                          ? "bg-violet-400/30 p-3 text-violet-600 hover:bg-violet-400/40"
                          : "bg-athens-gray-200/40 p-3 text-athens-gray-600 hover:bg-athens-gray-300/40"
                      )}
                    >
                      {favCat1IconId ||
                      userSettings?.favoriteCategory1?.iconId ? (
                        icons.find(
                          (icon) =>
                            icon.id ===
                            (favCat1IconId ||
                              userSettings?.favoriteCategory1?.iconId)
                        )?.icon
                      ) : (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="h-5 w-5"
                        >
                          <circle cx="12" cy="12" r="10" />
                          <path d="m4.9 4.9 14.2 14.2" />
                        </svg>
                      )}
                    </div>
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-full sm:mt-0 sm:w-[200px]">
                        <Popover
                          open={favCategory1}
                          onOpenChange={setFavCategory1}
                        >
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              role="combobox"
                              aria-expanded={favCategory1}
                              className="w-full justify-between bg-white"
                            >
                              {favCat1Value == ""
                                ? userSettings?.favoriteCategory1?.name
                                  ? categories.find(
                                      (category) =>
                                        category.label ===
                                        userSettings?.favoriteCategory1?.name
                                    )?.value ||
                                    userSettings?.favoriteCategory1?.name
                                  : "Select category"
                                : favCat1Value}
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="24"
                                height="24"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="ml-2 h-4 w-4 shrink-0 opacity-50"
                              >
                                <path d="m7 15 5 5 5-5" />
                                <path d="m7 9 5-5 5 5" />
                              </svg>
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-full p-0">
                            <Command>
                              <CommandInput
                                placeholder="Type category"
                                onChangeCapture={handleFav1InputChange}
                              />
                              <CommandEmpty>
                                <div className="flex flex-col">
                                  <Tabs
                                    defaultValue="text"
                                    className="w-full text-center"
                                  >
                                    <TabsList>
                                      <TabsTrigger value="text">
                                        Text
                                      </TabsTrigger>
                                      <TabsTrigger value="icon">
                                        Icon
                                      </TabsTrigger>
                                    </TabsList>
                                    <TabsContent value="text">
                                      <Input
                                        className="h-7 text-xs"
                                        value={favCat1DispValue}
                                        disabled
                                      />
                                    </TabsContent>
                                    <TabsContent value="icon">
                                      <div className="flex justify-center">
                                        <div className="grid grid-cols-5 gap-2">
                                          {icons.map(
                                            (icon, index) =>
                                              index > 6 && (
                                                <div
                                                  key={icon.id}
                                                  className={cn(
                                                    "rounded-sm p-2 hover:cursor-pointer",
                                                    icon.id ===
                                                      favCat1DispIconId
                                                      ? "bg-violet-500 text-primary-foreground"
                                                      : "hover:bg-muted "
                                                  )}
                                                  onClick={() => {
                                                    setFavCat1DispIconId(
                                                      icon.id
                                                    );
                                                  }}
                                                >
                                                  {icon.icon}
                                                </div>
                                              )
                                          )}
                                        </div>
                                      </div>
                                    </TabsContent>
                                  </Tabs>

                                  <button
                                    onClick={() => {
                                      setValue("favCat1", {
                                        value: favCat1DispValue,
                                        label: favCat1DispValue,
                                        iconId: favCat1DispIconId,
                                      });
                                      setFavCat1IconId(favCat1DispIconId);
                                      setFavCat1Value(favCat1DispValue);
                                      setFavCategory1(false);
                                    }}
                                    className="mt-2 inline w-full items-center justify-center rounded-md bg-violet-500 py-2 text-xs font-medium text-white"
                                  >
                                    Create &quot;{favCat1DispValue}
                                    &quot;
                                  </button>
                                </div>
                              </CommandEmpty>
                              {/* <CommandGroup>
                                {categories.map((category) => (
                                  <CommandItem
                                    key={category.id}
                                    onSelect={() => {
                                      setFavCat1Value(
                                        category.value === favCat1Value
                                          ? ""
                                          : category.value
                                      );
                                      setFavCat1IconId(
                                        category.iconId === favCat1IconId
                                          ? null
                                          : category.iconId
                                      );

                                      setValue("favCat1", {
                                        value: category.value,
                                        label: category.value,
                                        iconId: category.iconId,
                                      });
                                      setFavCategory1(false);
                                    }}
                                  >
                                    <svg
                                      xmlns="http://www.w3.org/2000/svg"
                                      width="24"
                                      height="24"
                                      viewBox="0 0 24 24"
                                      fill="none"
                                      stroke="currentColor"
                                      strokeWidth="2"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        "fix" === category.value
                                          ? "opacity-100"
                                          : "opacity-0"
                                      )}
                                    >
                                      <path d="M20 6 9 17l-5-5" />
                                    </svg>
                                    {icons[category?.iconId - 1]?.icon}
                                    <span className="ml-3">
                                      {category.value}
                                    </span>
                                  </CommandItem>
                                ))}
                              </CommandGroup> */}
                            </Command>
                          </PopoverContent>
                        </Popover>
                      </div>
                      <Button
                        variant={"accent"}
                        type="button"
                        onClick={() => {
                          resetFav1Category({ email: emailValue });
                          setValue("favCat1", null);
                          setFavCat1IconId(null);
                          setFavCat1Value("");
                        }}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className={cn(
                            isResetFav1CategoryLoading &&
                              "rotate-180 transform animate-spin"
                          )}
                        >
                          <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                          <path d="M3 3v5h5" />
                          <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
                          <path d="M16 16h5v5" />
                        </svg>
                      </Button>
                    </div>
                  </div>

                  <p className="mt-5 text-sm font-medium">Category 2</p>
                  <div className="mb-5 mt-2 flex items-center justify-between rounded-md border border-athens-gray-100 p-2">
                    <div
                      className={cn(
                        "cursor-pointer rounded-md",
                        favCat2IconId || userSettings?.favoriteCategory2?.iconId
                          ? "bg-violet-400/30 p-3 text-violet-600 hover:bg-violet-400/40"
                          : "bg-athens-gray-200/40 p-3 text-athens-gray-600 hover:bg-athens-gray-300/40"
                      )}
                    >
                      {favCat2IconId ||
                      userSettings?.favoriteCategory2?.iconId ? (
                        icons.find(
                          (icon) =>
                            icon.id ===
                            (favCat2IconId ||
                              userSettings?.favoriteCategory2?.iconId)
                        )?.icon
                      ) : (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="h-5 w-5"
                        >
                          <circle cx="12" cy="12" r="10" />
                          <path d="m4.9 4.9 14.2 14.2" />
                        </svg>
                      )}
                    </div>
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-full sm:mt-0 sm:w-[200px]">
                        <Popover
                          open={favCategory2}
                          onOpenChange={setFavCategory2}
                        >
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              role="combobox"
                              aria-expanded={favCategory2}
                              className="w-full justify-between bg-white"
                            >
                              {favCat2Value == ""
                                ? userSettings?.favoriteCategory2?.name
                                  ? categories.find(
                                      (category) =>
                                        category.label ===
                                        userSettings?.favoriteCategory2?.name
                                    )?.value ||
                                    userSettings?.favoriteCategory2?.name
                                  : "Select category"
                                : favCat2Value}
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="24"
                                height="24"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="ml-2 h-4 w-4 shrink-0 opacity-50"
                              >
                                <path d="m7 15 5 5 5-5" />
                                <path d="m7 9 5-5 5 5" />
                              </svg>
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-full p-0">
                            <Command>
                              <CommandInput
                                placeholder="Type category"
                                onChangeCapture={handleFav2InputChange}
                              />
                              <CommandEmpty>
                                <div className="flex flex-col">
                                  <Tabs
                                    defaultValue="text"
                                    className="w-full text-center"
                                  >
                                    <TabsList>
                                      <TabsTrigger value="text">
                                        Text
                                      </TabsTrigger>
                                      <TabsTrigger value="icon">
                                        Icon
                                      </TabsTrigger>
                                    </TabsList>
                                    <TabsContent value="text">
                                      <Input
                                        className="h-7 text-xs"
                                        value={favCat2DispValue}
                                        disabled
                                      />
                                    </TabsContent>
                                    <TabsContent value="icon">
                                      <div className="flex justify-center">
                                        <div className="grid grid-cols-5 gap-2">
                                          {icons.map(
                                            (icon, index) =>
                                              index > 6 && (
                                                <div
                                                  key={icon.id}
                                                  className={cn(
                                                    "rounded-sm p-2 hover:cursor-pointer",
                                                    icon.id ===
                                                      favCat2DispIconId
                                                      ? "bg-violet-500 text-primary-foreground"
                                                      : "hover:bg-muted "
                                                  )}
                                                  onClick={() => {
                                                    setFavCat2DispIconId(
                                                      icon.id
                                                    );
                                                  }}
                                                >
                                                  {icon.icon}
                                                </div>
                                              )
                                          )}
                                        </div>
                                      </div>
                                    </TabsContent>
                                  </Tabs>

                                  <button
                                    onClick={() => {
                                      setValue("favCat2", {
                                        value: favCat2DispValue,
                                        label: favCat2DispValue,
                                        iconId: favCat2DispIconId,
                                      });
                                      setFavCat2IconId(favCat2DispIconId);
                                      setFavCat2Value(favCat2DispValue);
                                      setFavCategory2(false);
                                    }}
                                    className="mt-2 inline w-full items-center justify-center rounded-md bg-violet-500 py-2 text-xs font-medium text-white"
                                  >
                                    Create &quot;{favCat2DispValue}
                                    &quot;
                                  </button>
                                </div>
                              </CommandEmpty>
                              <CommandGroup>
                                {categories.map((category) => (
                                  <CommandItem
                                    key={category.id}
                                    onSelect={() => {
                                      setFavCat2Value(
                                        category.value === favCat1Value
                                          ? ""
                                          : category.value
                                      );
                                      setFavCat2IconId(
                                        category.iconId === favCat1IconId
                                          ? null
                                          : category.iconId
                                      );
                                      setValue("favCat2", {
                                        value: category.value,
                                        label: category.value,
                                        iconId: category.iconId,
                                      });
                                      setFavCategory2(false);
                                    }}
                                  >
                                    <svg
                                      xmlns="http://www.w3.org/2000/svg"
                                      width="24"
                                      height="24"
                                      viewBox="0 0 24 24"
                                      fill="none"
                                      stroke="currentColor"
                                      strokeWidth="2"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        "fix" === category.value
                                          ? "opacity-100"
                                          : "opacity-0"
                                      )}
                                    >
                                      <path d="M20 6 9 17l-5-5" />
                                    </svg>
                                    {icons[category?.iconId - 1]?.icon}
                                    <span className="ml-3">
                                      {category.value}
                                    </span>
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </Command>
                          </PopoverContent>
                        </Popover>
                      </div>
                      <Button
                        variant={"accent"}
                        type="button"
                        onClick={() => {
                          resetFav2Category({ email: emailValue });
                          setValue("favCat2", null);
                          setFavCat2IconId(null);
                          setFavCat2Value("");
                        }}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className={cn(
                            isResetFav2CategoryLoading &&
                              "rotate-180 transform animate-spin"
                          )}
                        >
                          <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                          <path d="M3 3v5h5" />
                          <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
                          <path d="M16 16h5v5" />
                        </svg>
                      </Button>
                    </div>
                  </div>

                  <p className="mt-5 text-sm font-medium">Category 3</p>
                  <div className="mb-5 mt-2 flex items-center justify-between rounded-md border border-athens-gray-100 p-2">
                    <div
                      className={cn(
                        "cursor-pointer rounded-md",
                        favCat3IconId || userSettings?.favoriteCategory3?.iconId
                          ? "bg-violet-400/30 p-3 text-violet-600 hover:bg-violet-400/40"
                          : "bg-athens-gray-200/40 p-3 text-athens-gray-600 hover:bg-athens-gray-300/40"
                      )}
                    >
                      {favCat3IconId ||
                      userSettings?.favoriteCategory3?.iconId ? (
                        icons.find(
                          (icon) =>
                            icon.id ===
                            (favCat3IconId ||
                              userSettings?.favoriteCategory3?.iconId)
                        )?.icon
                      ) : (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="h-5 w-5"
                        >
                          <circle cx="12" cy="12" r="10" />
                          <path d="m4.9 4.9 14.2 14.2" />
                        </svg>
                      )}
                    </div>
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-full sm:mt-0 sm:w-[200px]">
                        <Popover
                          open={favCategory3}
                          onOpenChange={setFavCategory3}
                        >
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              role="combobox"
                              aria-expanded={favCategory3}
                              className="w-full justify-between bg-white"
                            >
                              {favCat3Value == ""
                                ? userSettings?.favoriteCategory3?.name
                                  ? categories.find(
                                      (category) =>
                                        category.label ===
                                        userSettings?.favoriteCategory3?.name
                                    )?.value ||
                                    userSettings?.favoriteCategory3?.name
                                  : "Select category"
                                : favCat3Value}
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="24"
                                height="24"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="ml-2 h-4 w-4 shrink-0 opacity-50"
                              >
                                <path d="m7 15 5 5 5-5" />
                                <path d="m7 9 5-5 5 5" />
                              </svg>
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-full p-0">
                            <Command>
                              <CommandInput
                                placeholder="Type category"
                                onChangeCapture={handleFav3InputChange}
                              />
                              <CommandEmpty>
                                <div className="flex flex-col">
                                  <Tabs
                                    defaultValue="text"
                                    className="w-full text-center"
                                  >
                                    <TabsList>
                                      <TabsTrigger value="text">
                                        Text
                                      </TabsTrigger>
                                      <TabsTrigger value="icon">
                                        Icon
                                      </TabsTrigger>
                                    </TabsList>
                                    <TabsContent value="text">
                                      <Input
                                        className="h-7 text-xs"
                                        value={favCat3DispValue}
                                        disabled
                                      />
                                    </TabsContent>
                                    <TabsContent value="icon">
                                      <div className="flex justify-center">
                                        <div className="grid grid-cols-5 gap-2">
                                          {icons.map(
                                            (icon, index) =>
                                              index > 6 && (
                                                <div
                                                  key={icon.id}
                                                  className={cn(
                                                    "rounded-sm p-2 hover:cursor-pointer",
                                                    icon.id ===
                                                      favCat3DispIconId
                                                      ? "bg-violet-500 text-primary-foreground"
                                                      : "hover:bg-muted "
                                                  )}
                                                  onClick={() => {
                                                    setFavCat3DispIconId(
                                                      icon.id
                                                    );
                                                  }}
                                                >
                                                  {icon.icon}
                                                </div>
                                              )
                                          )}
                                        </div>
                                      </div>
                                    </TabsContent>
                                  </Tabs>

                                  <button
                                    onClick={() => {
                                      setValue("favCat3", {
                                        value: favCat3DispValue,
                                        label: favCat3DispValue,
                                        iconId: favCat3DispIconId,
                                      });
                                      setFavCat3IconId(favCat3DispIconId);
                                      setFavCat3Value(favCat3DispValue);
                                      setFavCategory3(false);
                                    }}
                                    className="mt-2 inline w-full items-center justify-center rounded-md bg-violet-500 py-2 text-xs font-medium text-white"
                                  >
                                    Create &quot;{favCat3DispValue}
                                    &quot;
                                  </button>
                                </div>
                              </CommandEmpty>
                              <CommandGroup>
                                {categories.map((category) => (
                                  <CommandItem
                                    key={category.id}
                                    onSelect={() => {
                                      setFavCat3Value(
                                        category.value === favCat3Value
                                          ? ""
                                          : category.value
                                      );
                                      setFavCat3IconId(
                                        category.iconId === favCat3IconId
                                          ? null
                                          : category.iconId
                                      );
                                      setValue("favCat3", {
                                        value: category.value,
                                        label: category.value,
                                        iconId: category.iconId,
                                      });
                                      setFavCategory3(false);
                                    }}
                                  >
                                    <svg
                                      xmlns="http://www.w3.org/2000/svg"
                                      width="24"
                                      height="24"
                                      viewBox="0 0 24 24"
                                      fill="none"
                                      stroke="currentColor"
                                      strokeWidth="2"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        "fix" === category.value
                                          ? "opacity-100"
                                          : "opacity-0"
                                      )}
                                    >
                                      <path d="M20 6 9 17l-5-5" />
                                    </svg>
                                    {icons[category?.iconId - 1]?.icon}
                                    <span className="ml-3">
                                      {category.value}
                                    </span>
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </Command>
                          </PopoverContent>
                        </Popover>
                      </div>
                      <Button
                        variant={"accent"}
                        className=""
                        type="button"
                        onClick={() => {
                          resetFav3Category({ email: emailValue });
                          setValue("favCat3", null);
                          setFavCat3IconId(null);
                          setFavCat3Value("");
                        }}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className={cn(
                            isResetFav3CategoryLoading &&
                              "rotate-180 transform animate-spin"
                          )}
                        >
                          <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                          <path d="M3 3v5h5" />
                          <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
                          <path d="M16 16h5v5" />
                        </svg>
                      </Button>
                    </div>
                  </div>
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
              <Dialog
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
              >
                <DialogTrigger asChild>
                  <Button
                    variant="destructive"
                    className="mt-2 flex items-center space-x-2 px-8"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-4 w-4"
                    >
                      <path d="M3 6h18" />
                      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                    </svg>
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
                          className="border border-input bg-white hover:bg-accent hover:text-accent-foreground"
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
                      <Button
                        variant="secondary"
                        onClick={() => setDeleteDialogOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        variant="destructive"
                        disabled={isDeleteAccountLoading}
                        className="w-24"
                      >
                        {isDeleteAccountLoading ? (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="#EF4444"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="h-4 w-4 animate-spin"
                          >
                            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                          </svg>
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
              <div className="flex flex-col space-x-0 space-y-2 sm:flex-row sm:space-x-3 sm:space-y-0">
                {/* <Button
                  variant={"outline"}
                  className="border-violet-500 text-violet-500 hover:text-violet-600"
                >
                  Cancel
                </Button> */}
                <Button
                  type="submit"
                  disabled={isEditNotificationLoading}
                  className="w-32"
                  onClick={onNotificationSubmit}
                >
                  {isEditNotificationLoading ? (
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
                    <span>Save Changes</span>
                  )}
                </Button>
              </div>
            </div>
            <hr />
            <div className="my-5 flex items-center justify-between rounded-lg border border-athens-gray-100 bg-white px-3 py-3">
              <div>
                <p className="font-semibold">Alert emails</p>
                <p className="text-sm font-medium text-athens-gray-300">
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
            <div className="my-5 flex items-center justify-between rounded-lg border border-athens-gray-100 bg-white px-3 py-3">
              <div>
                <p className="font-semibold">Monthly Report</p>
                <p className="text-sm font-medium text-athens-gray-300">
                  Receive emails about monthly spending report, turning off will
                  not generate any report at end of each month
                </p>
              </div>
              <div>
                <Switch
                  checked={monthlyReport}
                  onCheckedChange={setMonthlyReport}
                  id="notification"
                />
              </div>
            </div>
          </TabsContent>
          <TabsContent value="dashboard">
            <div className="flex items-center justify-between">
              <div className="my-5">
                <p className="font-semibold">Dashboard Layout</p>
                <p className="text-sm font-medium text-athens-gray-300">
                  Customize your dashboard layout here, drag to reorder
                </p>
              </div>
              <div className="flex flex-col space-x-0 space-y-2 sm:flex-row sm:space-x-3 sm:space-y-0">
                <Button variant={"accent"} onClick={resetDashboard}>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                    <path d="M3 3v5h5" />
                    <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
                    <path d="M16 16h5v5" />
                  </svg>
                </Button>
                <Button
                  type="submit"
                  disabled={isDashboardLoading}
                  className="w-32"
                  // eslint-disable-next-line @typescript-eslint/no-misused-promises
                  onClick={onDashboardSubmit}
                >
                  {isDashboardLoading ? (
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
                    <span>Save Changes</span>
                  )}
                </Button>
              </div>
            </div>
            <hr />
            <div className="mt-10 space-y-5">
              <div className="space-y-3 rounded-lg bg-athens-gray-100 p-3">
                <p className="text-sm font-semibold text-athens-gray-700">
                  Row 1:
                </p>
                <DndContext
                  sensors={sensors}
                  onDragStart={handleDragStart1}
                  onDragEnd={handleDragEnd1}
                  onDragCancel={handleDragCancel1}
                >
                  <SortableContext
                    items={items1 || []}
                    strategy={verticalListSortingStrategy}
                  >
                    {items1?.map((item) => (
                      <SortableItem key={item.id} id={item.id} item={item} />
                    ))}
                  </SortableContext>
                  <DragOverlay>
                    {activeItem1 ? (
                      <SortableItem
                        key={activeItem1.id}
                        id={activeItem1.id}
                        item={activeItem1}
                      />
                    ) : null}
                  </DragOverlay>
                </DndContext>
              </div>

              <div className="space-y-3 rounded-lg bg-athens-gray-100 p-3">
                <p className="text-sm font-semibold text-athens-gray-700">
                  Row 2:
                </p>
                <DndContext
                  sensors={sensors}
                  onDragStart={handleDragStart2}
                  onDragEnd={handleDragEnd2}
                  onDragCancel={handleDragCancel2}
                >
                  <SortableContext
                    items={items2 || []}
                    strategy={verticalListSortingStrategy}
                  >
                    {items2?.map((item) => (
                      <SortableItem key={item.id} id={item.id} item={item} />
                    ))}
                  </SortableContext>
                  <DragOverlay>
                    {activeItem2 ? (
                      <SortableItem
                        key={activeItem2.id}
                        id={activeItem2.id}
                        item={activeItem2}
                      />
                    ) : null}
                  </DragOverlay>
                </DndContext>
              </div>
              <div className="space-y-3 rounded-lg bg-athens-gray-100 p-3">
                <p className="text-sm font-semibold text-athens-gray-700">
                  Row 3:
                </p>
                <DndContext
                  sensors={sensors}
                  onDragStart={handleDragStart3}
                  onDragEnd={handleDragEnd3}
                  onDragCancel={handleDragCancel3}
                >
                  <SortableContext
                    items={items3 || []}
                    strategy={verticalListSortingStrategy}
                  >
                    {items3?.map((item) => (
                      <SortableItem key={item.id} id={item.id} item={item} />
                    ))}
                  </SortableContext>
                  <DragOverlay>
                    {activeItem3 ? (
                      <SortableItem
                        key={activeItem3.id}
                        id={activeItem3.id}
                        item={activeItem3}
                      />
                    ) : null}
                  </DragOverlay>
                </DndContext>
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
