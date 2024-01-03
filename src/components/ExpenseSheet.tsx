/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/restrict-plus-operands */
/* eslint-disable @typescript-eslint/restrict-template-expressions */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { useSession } from "next-auth/react";
import { useToast } from "@/components/ui/use-toast";
import { api } from "@/utils/api";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { useState, useRef } from "react";
import { icons, categories } from "@/store/category";

interface EditSheetProps {
  expense: any;
  currency: any;
  favCategories: any;
}

const editExpenseSchema = z.object({
  id: z.string(),
  description: z
    .string()
    .min(5, { message: "Description must be at least 5 characters" }),
  amount: z
    .number({
      required_error: "Amount is required",
      invalid_type_error: "Amount must be a number",
    })
    .min(0, { message: "Must be greater than 0" }),
  date: z.date(),
  category: z.object({
    id: z.number().nullable(),
    value: z.string(),
    label: z.string(),
    iconId: z.number(),
  }),
  imgUrl: z.string().optional(),
});

export const ExpenseSheet: React.FC<EditSheetProps> = ({
  expense,
  currency,
  favCategories,
}) => {
  const { data: session } = useSession();

  const { toast } = useToast();

  const {
    handleSubmit: editHandleSubmit,
    formState: { errors: editErrors },
    setValue: editSetValue,
    reset: editReset,
  } = useForm<z.infer<typeof editExpenseSchema>>({
    resolver: zodResolver(editExpenseSchema),
  });

  const delay = (ms: number | undefined) =>
    new Promise((res) => setTimeout(res, ms));

  const onEditSubmit = async (data: z.infer<typeof editExpenseSchema>) => {
    setIsEditLoading(true);
    let imageUrl: string | null = null;
    if (editReceiptImage) {
      const formData = new FormData();
      formData.append("file", editReceiptImage);
      formData.append("upload_preset", "oxd8flh9");
      formData.append(
        "folder",
        `duithive/users/${session?.user?.email as string}/expense`
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
    } else {
      await delay(500);
    }
    editExpense({ ...data, ...(imageUrl && { imgUrl: imageUrl }) });
    setIsEditLoading(false);
  };

  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
  const [editDate, setEditDate] = useState<Date | undefined>(new Date());
  const [editIconId, setEditIconId] = useState<number>(8);
  const [openCategory, setOpenCategory] = useState<boolean>(false);
  const [editCategoryValue, setEditCategoryValue] = useState<string>("");
  const [editDispValue, setEditDispValue] = useState<string>("");
  const inputDescriptionRef = useRef<HTMLInputElement>(null);
  const inputAmountRef = useRef<HTMLInputElement>(null);
  const [sheetOpen, setSheetOpen] = useState<boolean>(false);

  //drag-and-drop image
  const [editReceiptImage, setEditReceiptImage] = useState<File | null>(null);
  const [editImageName, setEditImageName] = useState<string>("");
  const [editFileSizeTooBig, setEditFileSizeTooBig] = useState<boolean>(false);
  const [editFileIsNotImage, setEditFileIsNotImage] = useState<boolean>(false);
  const [isEditLoading, setIsEditLoading] = useState<boolean>(false);
  const ctx = api.useContext();

  const { mutate: deleteExpense, isLoading: isDeleting } =
    api.expense.deleteExpense.useMutation({
      onSuccess: () => {
        void ctx.expense.getPaginated.invalidate();
        toast({
          variant: "success",
          status: "success",
          title: "Expense deleted successfully!",
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

  const { mutate: editExpense } = api.expense.editExpense.useMutation({
    onSuccess: (resp) => {
      editReset();
      setEditDate(resp.transactionDate);
      setEditIconId(resp.category?.iconId as number);
      setEditCategoryValue(resp.category?.name as string);
      setEditDispValue("");
      setEditReceiptImage(null);
      setEditImageName("");
      setSheetOpen(false);
      void ctx.expense.getPaginated.invalidate();
      toast({
        variant: "success",
        status: "success",
        title: "Success!",
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
      setIsEditLoading(false);
    },
  });

  const handleDelete = (id: string) => {
    deleteExpense({ id: id });
    setDeleteDialogOpen(false);
  };

  const onChangeEditImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditFileSizeTooBig(false);
    setEditFileIsNotImage(false);
    setEditReceiptImage(null);
    const file = e.currentTarget.files && e.currentTarget.files[0];
    const validImageType = ["image/jpeg"];
    if (file) {
      if (file.size / 1024 / 1024 > 5) {
        setEditFileSizeTooBig(true);
        setEditReceiptImage(null);
        setEditImageName("");
      } else if (!validImageType.includes(file.type)) {
        setEditFileIsNotImage(true);
        setEditReceiptImage(null);
        setEditImageName("");
      } else {
        const reader = new FileReader();
        reader.onload = (e) => {
          setEditImageName(e.target?.result as string);
        };
        reader.readAsDataURL(file);
        setEditReceiptImage(file);
      }
    }
  };

  const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditDispValue(e.target.value);
  };

  return (
    <Sheet key={expense.id} open={sheetOpen} onOpenChange={setSheetOpen}>
      <SheetTrigger
        asChild
        onClick={() => {
          setEditDate(expense.transactionDate);
          if (inputDescriptionRef.current) {
            inputDescriptionRef.current.defaultValue = expense.description;
          }
          if (inputAmountRef.current) {
            inputAmountRef.current.defaultValue = expense.amount.toString();
          }
          editSetValue("id", expense.id);
          setEditCategoryValue(expense.category?.name || "");
          editSetValue("description", expense.description);
          editSetValue("amount", parseFloat(expense.amount.toString()));
          editSetValue("date", expense.transactionDate);
          editSetValue("category", {
            id: null,
            value: expense.category?.name ?? "",
            label: expense.category?.name ?? "",
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            iconId: expense.category!.iconId,
          });
        }}
      >
        <div className="border-athens-gray-200/50ease-in-out flex items-center justify-between space-x-3 rounded-md border bg-white p-3 transition-colors duration-300 hover:cursor-pointer hover:bg-white/50">
          <div className="rounded-md bg-violet-400/30 p-3 text-violet-600">
            {icons.find((icon) => icon.id === expense.category?.iconId)?.icon}
          </div>
          <div className="flex flex-1 justify-between">
            <div>
              <p className="text-sm font-semibold">{expense.description}</p>
              <p className="text-sm font-normal text-[#A0A5AF]">
                {expense.category?.name}
              </p>
            </div>
            <div>
              <p className="text-sm font-semibold">
                {currency?.symbol}
                {parseFloat(expense.amount.toString()).toFixed(2)}
              </p>
              <p className="text-sm font-normal text-[#A0A5AF]">
                {expense.transactionDate.getDate() < 10
                  ? `0${expense.transactionDate.getDate()}`
                  : expense.transactionDate.getDate()}
                /
                {expense.transactionDate.getMonth() + 1 < 10
                  ? `0${expense.transactionDate.getMonth() + 1}`
                  : expense.transactionDate.getMonth() + 1}
                /{expense.transactionDate.getFullYear()}
              </p>
            </div>
          </div>
        </div>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{expense.description}</SheetTitle>
          <form
            className="mt-10 space-y-3"
            // eslint-disable-next-line @typescript-eslint/no-misused-promises
            onSubmit={editHandleSubmit(onEditSubmit)}
          >
            <div className="relative z-[9000] duration-700 animate-in fade-in slide-in-from-left-8">
              {!expense.imgUrl && (
                <>
                  <label htmlFor="image-upload">
                    <div className="absolute right-0 top-0 z-[9999] mr-3 mt-3 flex cursor-pointer items-center space-x-2 rounded-sm border border-athens-gray-200 bg-athens-gray-200/40 px-2 py-1 text-xs transition-colors hover:bg-athens-gray-200/70">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="15"
                        height="15"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#9776EB"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="lucide lucide-pencil-ruler"
                      >
                        <path d="m15 5 4 4" />
                        <path d="M13 7 8.7 2.7a2.41 2.41 0 0 0-3.4 0L2.7 5.3a2.41 2.41 0 0 0 0 3.4L7 13" />
                        <path d="m8 6 2-2" />
                        <path d="m2 22 5.5-1.5L21.17 6.83a2.82 2.82 0 0 0-4-4L3.5 16.5Z" />
                        <path d="m18 16 2-2" />
                        <path d="m17 11 4.3 4.3c.94.94.94 2.46 0 3.4l-2.6 2.6c-.94.94-2.46.94-3.4 0L11 17" />
                      </svg>
                      <span>Upload</span>
                    </div>
                  </label>
                  <input
                    id="image-upload"
                    name="image-upload"
                    type="file"
                    accept="image/jpeg"
                    className="sr-only"
                    // eslint-disable-next-line @typescript-eslint/no-misused-promises
                    onChange={onChangeEditImage}
                  />
                </>
              )}
              <label
                className={cn(
                  "group relative mx-auto flex aspect-square h-full w-full flex-col items-center justify-center rounded-lg border border-[#e2e8f0]  transition duration-100"
                )}
              >
                <div className="absolute z-40 aspect-square h-full w-full rounded-md bg-athens-gray-50 object-contain" />
                <div
                  className={cn(
                    "absolute z-50 flex flex-col items-center justify-center text-center text-xs font-medium transition-all duration-100",
                    expense.imgUrl && "hidden"
                  )}
                >
                  <p className="font-light italic text-[#A0A5AF]">
                    No image available
                  </p>
                </div>
                {expense.imgUrl && (
                  <img
                    src={expense.imgUrl}
                    alt="Preview"
                    className="z-[200] aspect-square h-full object-contain"
                  />
                )}
                {editImageName && (
                  <img
                    src={editImageName}
                    alt="Preview"
                    className="z-[200] aspect-square h-full object-contain"
                  />
                )}
              </label>
              {editFileSizeTooBig && (
                <p className="z-[500] text-xs text-red-500">
                  File size too big (less than 5MB)
                </p>
              )}
              {editFileIsNotImage && (
                <p className="z-[500] text-xs text-red-500">
                  File is not an image
                </p>
              )}
            </div>
            <div>
              <label className="text-sm">Description</label>
              <Input
                className="mt-2 border border-input bg-white hover:bg-accent hover:text-accent-foreground"
                placeholder="Enter description"
                defaultValue={expense.description}
                onChange={(e) => {
                  editSetValue("description", e.target.value);
                }}
                ref={inputDescriptionRef}
              />

              <div className="h-3">
                {editErrors.description && (
                  <span className="text-xxs text-red-500">
                    {editErrors.description.message}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-1/3">
                <label className="text-sm">Amount</label>
                <Input
                  className="mt-2 border border-input bg-white hover:bg-accent hover:text-accent-foreground"
                  placeholder="Enter amount"
                  defaultValue={parseFloat(expense.amount.toString())}
                  onChange={(e) => {
                    editSetValue("amount", parseFloat(e.target.value));
                  }}
                  type="number"
                  step="0.01"
                  ref={inputAmountRef}
                />
                <div className="h-3">
                  {editErrors.amount && (
                    <span className="text-xxs text-red-500">
                      {editErrors.amount.message}
                    </span>
                  )}
                </div>
              </div>
              <div className="w-2/3">
                <p className="mb-2 text-sm">Category</p>
                <Popover open={openCategory} onOpenChange={setOpenCategory}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={openCategory}
                      className="w-full justify-between"
                    >
                      {editCategoryValue
                        ? categories.find(
                            (category) =>
                              category.label === editCategoryValue.toLowerCase()
                          )?.value ||
                          (editCategoryValue.toLowerCase() ===
                          favCategories?.favoriteCategory1?.name?.toLowerCase()
                            ? favCategories?.favoriteCategory1?.name
                            : editCategoryValue.toLowerCase() ===
                              favCategories?.favoriteCategory2?.name?.toLowerCase()
                            ? favCategories?.favoriteCategory2?.name
                            : editCategoryValue.toLowerCase() ===
                              favCategories?.favoriteCategory3?.name?.toLowerCase()
                            ? favCategories?.favoriteCategory3?.name
                            : editCategoryValue)
                        : "Select category"}
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
                        placeholder="Search category..."
                        onChangeCapture={handleEditInputChange}
                      />
                      <CommandEmpty>
                        <div className="flex flex-col">
                          <Tabs
                            defaultValue="text"
                            className="w-full text-center"
                          >
                            <TabsList>
                              <TabsTrigger value="text">Text</TabsTrigger>
                              <TabsTrigger value="icon">Icon</TabsTrigger>
                            </TabsList>
                            <TabsContent value="text">
                              <Input
                                className="h-7 text-xs "
                                value={editDispValue}
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
                                            icon.id === editIconId
                                              ? "bg-violet-500 text-primary-foreground"
                                              : "hover:bg-muted "
                                          )}
                                          onClick={() => {
                                            setEditIconId(icon.id);
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
                              setEditCategoryValue(editDispValue);
                              editSetValue("category", {
                                id: categories.length + 1,
                                value: editDispValue,
                                label: editDispValue,
                                iconId: editIconId,
                              });
                              categories.push({
                                id: categories.length + 1,
                                value: editDispValue,
                                label: editDispValue,
                                iconId: editIconId,
                              });
                              setOpenCategory(false);
                            }}
                            className="mt-2 inline w-full items-center justify-center rounded-md bg-violet-500 py-2 text-xs font-medium text-white"
                          >
                            Create &quot;{editDispValue}
                            &quot;
                          </button>
                        </div>
                      </CommandEmpty>
                      <CommandGroup>
                        {(favCategories?.favoriteCategory1 ||
                          favCategories?.favoriteCategory2 ||
                          favCategories?.favoriteCategory3) && (
                          <p className="flex items-center text-xs font-medium">
                            Favorites
                            <span>
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="24"
                                height="24"
                                viewBox="0 0 24 24"
                                fill="#ECB33E"
                                stroke="#ECB33E"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="ml-1 h-3 w-3"
                              >
                                <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
                                <path d="M5 3v4" />
                                <path d="M19 17v4" />
                                <path d="M3 5h4" />
                                <path d="M17 19h4" />
                              </svg>
                            </span>
                          </p>
                        )}
                        {favCategories?.favoriteCategory1 && (
                          <CommandItem
                            onSelect={(selectedCategory) => {
                              setEditCategoryValue(
                                selectedCategory === editCategoryValue
                                  ? ""
                                  : selectedCategory
                              );
                              editSetValue("category", {
                                id: null,
                                value: favCategories?.favoriteCategory1
                                  ?.name as string,
                                label: favCategories?.favoriteCategory1
                                  ?.name as string,
                                iconId: favCategories?.favoriteCategory1
                                  ?.iconId as number,
                              });
                              setOpenCategory(false);
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
                                editCategoryValue.toLowerCase() ===
                                  favCategories?.favoriteCategory1?.name?.toLowerCase()
                                  ? "opacity-100"
                                  : "opacity-0"
                              )}
                            >
                              <path d="M20 6 9 17l-5-5" />
                            </svg>
                            {
                              icons[favCategories?.favoriteCategory1.iconId - 1]
                                ?.icon
                            }
                            <span className="ml-3">
                              {favCategories?.favoriteCategory1?.name}
                            </span>
                          </CommandItem>
                        )}
                        {favCategories?.favoriteCategory2 && (
                          <CommandItem
                            onSelect={(selectedCategory) => {
                              setEditCategoryValue(
                                selectedCategory === editCategoryValue
                                  ? ""
                                  : selectedCategory
                              );
                              editSetValue("category", {
                                id: null,
                                value: favCategories?.favoriteCategory2
                                  ?.name as string,
                                label: favCategories?.favoriteCategory2
                                  ?.name as string,
                                iconId: favCategories?.favoriteCategory2
                                  ?.iconId as number,
                              });
                              setOpenCategory(false);
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
                                editCategoryValue.toLowerCase() ===
                                  favCategories?.favoriteCategory2?.name?.toLowerCase()
                                  ? "opacity-100"
                                  : "opacity-0"
                              )}
                            >
                              <path d="M20 6 9 17l-5-5" />
                            </svg>
                            {
                              icons[favCategories?.favoriteCategory2.iconId - 1]
                                ?.icon
                            }
                            <span className="ml-3">
                              {favCategories?.favoriteCategory2?.name}
                            </span>
                          </CommandItem>
                        )}
                        {favCategories?.favoriteCategory3 && (
                          <CommandItem
                            onSelect={(selectedCategory) => {
                              setEditCategoryValue(
                                selectedCategory === editCategoryValue
                                  ? ""
                                  : selectedCategory
                              );
                              editSetValue("category", {
                                id: null,
                                value: favCategories?.favoriteCategory3
                                  ?.name as string,
                                label: favCategories?.favoriteCategory3
                                  ?.name as string,
                                iconId: favCategories?.favoriteCategory3
                                  ?.iconId as number,
                              });
                              setOpenCategory(false);
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
                                editCategoryValue.toLowerCase() ===
                                  favCategories?.favoriteCategory3?.name?.toLowerCase()
                                  ? "opacity-100"
                                  : "opacity-0"
                              )}
                            >
                              <path d="M20 6 9 17l-5-5" />
                            </svg>
                            {
                              icons[favCategories?.favoriteCategory3.iconId - 1]
                                ?.icon
                            }
                            <span className="ml-3">
                              {favCategories?.favoriteCategory3?.name}
                            </span>
                          </CommandItem>
                        )}

                        {(favCategories?.favoriteCategory1 ||
                          favCategories?.favoriteCategory2 ||
                          favCategories?.favoriteCategory3) && (
                          <hr className="my-2" />
                        )}

                        {/* default cats */}
                        {categories.map((category) => (
                          <CommandItem
                            key={category.id}
                            onSelect={() => {
                              setEditCategoryValue(
                                category.value === editCategoryValue
                                  ? ""
                                  : category.value
                              );
                              editSetValue("category", {
                                id: category.id,
                                value: category.value,
                                label: category.value,
                                iconId: category.iconId,
                              });
                              setOpenCategory(false);
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
                                editCategoryValue === category.value
                                  ? "opacity-100"
                                  : "opacity-0"
                              )}
                            >
                              <path d="M20 6 9 17l-5-5" />
                            </svg>
                            {icons[category?.iconId - 1]?.icon}
                            <span className="ml-3">{category.value}</span>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </Command>
                  </PopoverContent>
                </Popover>
                <div className="h-3">
                  {editErrors.category && (
                    <span className="text-xxs text-red-500">
                      {editErrors.category.message}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div>
              <div className="flex flex-col">
                <p className="mb-2 text-sm">Date</p>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-[240px] justify-start text-left font-normal",
                        !editDate && "text-muted-foreground"
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
                        className="mr-2 h-4 w-4"
                      >
                        <rect
                          width="18"
                          height="18"
                          x="3"
                          y="4"
                          rx="2"
                          ry="2"
                        />
                        <line x1="16" x2="16" y1="2" y2="6" />
                        <line x1="8" x2="8" y1="2" y2="6" />
                        <line x1="3" x2="21" y1="10" y2="10" />
                      </svg>
                      {editDate ? (
                        format(editDate, "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={editDate}
                      onSelect={(data) => {
                        setEditDate(data);
                        editSetValue("date", data as Date);
                      }}
                      initialFocus
                      disabled={(date) =>
                        date > new Date() || date < new Date("1900-01-01")
                      }
                    />
                  </PopoverContent>
                </Popover>
                <div className="h-3">
                  {editErrors.date && (
                    <span className="text-xxs text-red-500">
                      {editErrors.date.message}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <Button type="submit" disabled={isEditLoading} className="w-full">
              {isEditLoading ? (
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
                <span>Save</span>
              )}
            </Button>
            <SheetClose asChild>
              <Dialog
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
              >
                <DialogTrigger asChild>
                  <Button
                    className="w-full space-x-3 bg-red-400"
                    variant={"destructive"}
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
                      <line x1="10" x2="10" y1="11" y2="17" />
                      <line x1="14" x2="14" y1="11" y2="17" />
                    </svg>
                    <p className="text-sm">Delete</p>
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Are you absolutely sure?</DialogTitle>
                    <DialogDescription>
                      This action cannot be undone. This will permanently remove
                      your expense record from the system.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter className="flex justify-center">
                    <Button
                      variant={"secondary"}
                      onClick={() => setDeleteDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant={"destructive"}
                      className="w-24"
                      disabled={isDeleting}
                      onClick={() => handleDelete(expense.id)}
                    >
                      {isDeleting ? (
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
                          className="h-4 w-4 animate-spin opacity-50"
                        >
                          <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                        </svg>
                      ) : (
                        <span>Delete</span>
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </SheetClose>
          </form>
        </SheetHeader>
      </SheetContent>
    </Sheet>
  );
};
