import { type NextPage } from "next";
import { getSession, useSession } from "next-auth/react";
import AppLayout from "@/components/AppLayout";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { SkeletonList } from "@/components/ui/skeletonList";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useState, useRef, useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import {
  ChevronRight,
  ChevronLeft,
  Trash2,
  Loader2,
  Plus,
  Upload,
  CalendarIcon,
  DollarSign,
} from "lucide-react";
import { useForm } from "react-hook-form";
import debounce from "lodash/debounce";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { api } from "@/utils/api";
import { useToast } from "@/components/ui/use-toast";
import Link from "next/link";
import { useRouter } from "next/router";

const createIncomeSchema = z.object({
  title: z.string().min(1, { message: "Title must be at least 1 character" }),
  description: z
    .string()
    .min(5, { message: "Description must be at least 5 characters" }),
  amount: z.number({
    required_error: "Amount is required",
    invalid_type_error: "Amount must be a number",
  }),
  date: z.date(),
});

const editIncomeSchema = z.object({
  id: z.string(),
  title: z.string().min(1, { message: "Title must be at least 1 character" }),
  description: z
    .string()
    .min(5, { message: "Description must be at least 5 characters" }),
  amount: z.number({
    required_error: "Amount is required",
    invalid_type_error: "Amount must be a number",
  }),
  date: z.date(),
});

const Income: NextPage = () => {
  const { data: session } = useSession();
  const { toast } = useToast();

  const {
    register,
    reset,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<z.infer<typeof createIncomeSchema>>({
    resolver: zodResolver(createIncomeSchema),
    defaultValues: {
      date: new Date(),
    },
  });

  const {
    handleSubmit: editHandleSubmit,
    formState: { errors: editErrors },
    setValue: editSetValue,
    reset: editReset,
  } = useForm<z.infer<typeof editIncomeSchema>>({
    resolver: zodResolver(editIncomeSchema),
  });

  const today = new Date();
  const formattedDate = today.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "2-digit",
  });
  const [dialogOpen, setDialogOpen] = useState<boolean>(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [editDate, setEditDate] = useState<Date | undefined>(new Date());
  const inputTitleRef = useRef<HTMLInputElement>(null);
  const inputDescriptionRef = useRef<HTMLInputElement>(null);
  const inputAmountRef = useRef<HTMLInputElement>(null);
  const ctx = api.useContext();
  const router = useRouter();

  //infiniteQuery
  const searchParams = useSearchParams();
  const selectedSize = searchParams.get("page_size");
  const [page, setPage] = useState<number>(0);
  const [dropdownOpen, setDropdownOpen] = useState<boolean>(false);

  //search function
  const [search, setSearch] = useState<string>("");

  const handleSearchInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPage(0);
    setSearch(e.target.value);
  };

  const debouncedHandleInputChange = useMemo(
    () => debounce(handleSearchInput, 200),
    []
  );

  // stop debouncing (if any pending) when the component unmounts
  useEffect(() => {
    return () => {
      debouncedHandleInputChange.cancel();
    };
  }, [debouncedHandleInputChange]);

  const { data: userCurrency } = api.user.getUserCurrency.useQuery({
    email: session?.user?.email as string,
  });

  const {
    data: searchResults,
    isLoading: isLoadingSearchResults,
    refetch: refetchSearch,
  } = api.income.search.useQuery({
    searchInput: search,
    limit: selectedSize ? parseInt(selectedSize) : 10,
  });

  useEffect(() => {
    refetchSearch;
  }, [search, refetchSearch]);

  const {
    data: incomes,
    isLoading: isLoadingIncome,
    fetchNextPage,
  } = api.income.getPaginated.useInfiniteQuery(
    {
      limit: selectedSize ? parseInt(selectedSize) : 10,
    },
    {
      getNextPageParam: (lastPage) => lastPage?.nextCursor,
    }
  );

  const handleFetchNextPage = async () => {
    await fetchNextPage();
    setPage((prev) => prev + 1);
  };

  const handleFetchPreviousPage = () => {
    setPage((prev) => prev - 1);
  };

  const { mutate: deleteIncome, isLoading: isDeleting } =
    api.income.deleteIncome.useMutation({
      onSuccess: () => {
        void ctx.income.getPaginated.invalidate();
        toast({
          variant: "success",
          status: "success",
          title: "Income deleted successfully!",
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

  const { mutate: createIncome, isLoading: isCreatingIncome } =
    api.income.create.useMutation({
      onSuccess: () => {
        reset();
        setDialogOpen(false);
        void ctx.income.getPaginated.invalidate();
        toast({
          variant: "success",
          status: "success",
          title: "Income created successfully!",
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

  const { mutate: editIncome, isLoading: isEditLoading } =
    api.income.editIncome.useMutation({
      onSuccess: (resp) => {
        editReset;
        setEditDate(resp.transactionDate);
        void ctx.income.getPaginated.invalidate();
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
      },
    });

  const onSubmit = (data: z.infer<typeof createIncomeSchema>) => {
    createIncome(data);
  };

  const onEditSubmit = (data: z.infer<typeof editIncomeSchema>) => {
    editIncome(data);
  };

  const handleDelete = (id: string) => {
    deleteIncome({ id: id });
    setDeleteDialogOpen(false);
  };

  const toShow = searchResults?.incomes
    ? searchResults.incomes
    : incomes?.pages[page]?.incomes;

  const nextCursor = incomes?.pages[page]?.nextCursor;

  return (
    <AppLayout>
      <main className="p-4">
        <h1 className="text-3xl font-bold">Income</h1>
        <div className="flex flex-col items-start justify-between sm:flex-row sm:items-center">
          <p className="text-left text-athens-gray-300">{formattedDate}</p>
          <div className="flex w-full flex-col items-center space-x-0 space-y-2 sm:w-auto sm:flex-row sm:space-x-2 sm:space-y-0">
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <Button
                className="mt-10 w-full sm:mt-0 sm:w-20 md:w-20 lg:w-20 xl:w-44"
                onClick={() => setDialogOpen(true)}
              >
                <Plus size={15} />
                <span className="ml-3 sm:hidden md:hidden lg:hidden xl:block">
                  Add Income
                </span>
              </Button>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Income</DialogTitle>
                </DialogHeader>
                <form
                  className="mt-5 space-y-3"
                  // eslint-disable-next-line @typescript-eslint/no-misused-promises
                  onSubmit={handleSubmit(onSubmit)}
                >
                  <div>
                    <label className="text-sm">Title</label>
                    <Input
                      className="mt-2 border border-input bg-white hover:bg-accent hover:text-accent-foreground"
                      {...register("title", { required: true })}
                    />
                    <div className="h-3">
                      {errors.title && (
                        <span className="text-xxs text-red-500">
                          {errors.title.message}
                        </span>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm">Description</label>
                    <Input
                      className="mt-2 border border-input bg-white hover:bg-accent hover:text-accent-foreground"
                      {...register("description", { required: true })}
                    />
                    <div className="h-3">
                      {errors.description && (
                        <span className="text-xxs text-red-500">
                          {errors.description.message}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-1/3">
                      <label className="text-sm">Amount</label>
                      <Input
                        className="mt-2 border border-input bg-white hover:bg-accent hover:text-accent-foreground"
                        {...register("amount", {
                          required: true,
                          valueAsNumber: true,
                        })}
                        type="number"
                        step="0.01"
                      />
                      <div className="h-3">
                        {errors.amount && (
                          <span className="text-xxs text-red-500">
                            {errors.amount.message}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="w-2/3">
                      <div className="flex flex-col">
                        <p className="mb-2 text-sm">Date</p>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full justify-start text-left font-normal",
                                !date && "text-muted-foreground"
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {date ? (
                                format(date, "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={date}
                              onSelect={(data) => {
                                setDate(data);
                                setValue("date", data as Date);
                              }}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <div className="h-3">
                          {errors.date && (
                            <span className="text-xxs text-red-500">
                              {errors.date.message}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={isCreatingIncome}
                    className="w-full"
                  >
                    {isCreatingIncome ? (
                      <Loader2
                        className="mr-2 h-4 w-4 animate-spin"
                        color="#803FE8"
                      />
                    ) : (
                      <span>Create</span>
                    )}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
            <Button
              onClick={() => void router.push("/income/batch/upload")}
              className="mt-10 w-full sm:mt-0 sm:w-20 md:w-20 lg:w-20 xl:w-44"
            >
              <Upload size={15} />
              <span className="ml-3 sm:hidden md:hidden lg:hidden xl:block">
                Batch Upload
              </span>
            </Button>
            <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
              <DropdownMenuTrigger>
                <div className="flex h-10 w-32 items-center justify-center rounded-md border border-athens-gray-200 bg-white text-muted-foreground/70">
                  {selectedSize || 10} / page
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <Link
                  href={`?page_size=10`}
                  onClick={() => setDropdownOpen(false)}
                  className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
                >
                  10
                </Link>
                <Link
                  href={`?page_size=20`}
                  onClick={() => setDropdownOpen(false)}
                  className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
                >
                  20
                </Link>
                <Link
                  href={`?page_size=50`}
                  onClick={() => setDropdownOpen(false)}
                  className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
                >
                  50
                </Link>
              </DropdownMenuContent>
            </DropdownMenu>
            <Input
              className="w-full items-center border border-athens-gray-200  bg-white bg-[url('/search.png')] bg-left bg-no-repeat pl-11 sm:hidden sm:w-52 md:hidden lg:block"
              onChange={debouncedHandleInputChange}
              placeholder="Search..."
            />
          </div>
        </div>
        <div className="mt-10 space-y-5">
          {isLoadingIncome || isLoadingSearchResults ? (
            <SkeletonList className="h-[60px]" />
          ) : (
            <>
              {toShow && toShow?.length > 0 ? (
                <>
                  {toShow?.map((income) => (
                    <Sheet key={income.id}>
                      <SheetTrigger
                        asChild
                        onClick={() => {
                          setEditDate(income.transactionDate);
                          if (inputTitleRef.current) {
                            inputTitleRef.current.defaultValue = income.title;
                          }
                          if (inputDescriptionRef.current) {
                            inputDescriptionRef.current.defaultValue =
                              income.description;
                          }
                          if (inputAmountRef.current) {
                            inputAmountRef.current.defaultValue =
                              income.amount.toString();
                          }
                          editSetValue("id", income.id);
                          editSetValue("description", income.description);
                          editSetValue(
                            "amount",
                            parseFloat(income.amount.toString())
                          );
                          editSetValue("date", income.transactionDate);
                        }}
                      >
                        <div className="flex items-center justify-between space-x-3 rounded-md border border-athens-gray-200/50 bg-white p-3 transition-colors duration-300 ease-in-out hover:cursor-pointer hover:bg-white/50">
                          <div className="rounded-md bg-violet-400/30 p-3 text-violet-600">
                            <DollarSign size={20} />
                          </div>
                          <div className="flex flex-1 justify-between">
                            <div>
                              <p className="text-sm font-semibold">
                                {income.title}
                              </p>
                              <p className="text-sm font-normal text-[#A0A5AF]">
                                {income.description}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm font-semibold">
                                {userCurrency?.symbol}
                                {parseFloat(income.amount.toString()).toFixed(
                                  2
                                )}
                              </p>
                              <p className="text-sm font-normal text-[#A0A5AF]">
                                {income.transactionDate.getDate() < 10
                                  ? `0${income.transactionDate.getDate()}`
                                  : income.transactionDate.getDate()}
                                /
                                {income.transactionDate.getMonth() + 1 < 10
                                  ? `0${income.transactionDate.getMonth() + 1}`
                                  : income.transactionDate.getMonth() + 1}
                                /{income.transactionDate.getFullYear()}
                              </p>
                            </div>
                          </div>
                        </div>
                      </SheetTrigger>
                      <SheetContent>
                        <SheetHeader>
                          <SheetTitle>{income.title}</SheetTitle>
                          <form
                            className="mt-10 space-y-3"
                            // eslint-disable-next-line @typescript-eslint/no-misused-promises
                            onSubmit={editHandleSubmit(onEditSubmit)}
                          >
                            <div>
                              <label className="text-sm">Title</label>
                              <Input
                                className="mt-2 border border-input bg-white hover:bg-accent hover:text-accent-foreground"
                                placeholder="Enter description"
                                defaultValue={income.title}
                                onChange={(e) => {
                                  editSetValue("title", e.target.value);
                                }}
                                ref={inputTitleRef}
                              />

                              <div className="h-3">
                                {editErrors.description && (
                                  <span className="text-xxs text-red-500">
                                    {editErrors.description.message}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div>
                              <label className="text-sm">Description</label>
                              <Input
                                className="mt-2 border border-input bg-white hover:bg-accent hover:text-accent-foreground"
                                placeholder="Enter description"
                                defaultValue={income.description}
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
                                  defaultValue={parseFloat(
                                    income.amount.toString()
                                  )}
                                  onChange={(e) => {
                                    editSetValue(
                                      "amount",
                                      parseFloat(e.target.value)
                                    );
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
                                <div className="flex flex-col">
                                  <p className="mb-2 text-sm">Date</p>
                                  <Popover>
                                    <PopoverTrigger asChild>
                                      <Button
                                        variant={"outline"}
                                        className={cn(
                                          "w-full justify-start text-left font-normal",
                                          !editDate && "text-muted-foreground"
                                        )}
                                      >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
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
                            </div>

                            <Button
                              type="submit"
                              disabled={isEditLoading}
                              className="w-full"
                            >
                              {isEditLoading ? (
                                <Loader2
                                  className="mr-2 h-4 w-4 animate-spin"
                                  color="#803FE8"
                                />
                              ) : (
                                <span>Save</span>
                              )}
                            </Button>
                          </form>
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
                                  <Trash2 className="h-4 w-4" />
                                  <p className="text-sm">Delete</p>
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>
                                    Are you absolutely sure?
                                  </DialogTitle>
                                  <DialogDescription>
                                    This action cannot be undone. This will
                                    permanently remove your income record from
                                    the system.
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
                                    onClick={() => handleDelete(income.id)}
                                  >
                                    {isDeleting ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <span>Delete</span>
                                    )}
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                          </SheetClose>
                        </SheetHeader>
                      </SheetContent>
                    </Sheet>
                  ))}
                </>
              ) : (
                <div className="relative items-center justify-center align-middle">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/upload.png"
                    className="mx-auto my-auto flex h-56  items-center sm:h-96"
                    alt="image-upload"
                  />
                  <p className="text-center text-sm italic text-athens-gray-300/75">
                    No incomes yet
                  </p>
                </div>
              )}
            </>
          )}
          <div className="flex justify-end">
            <div className="flex border border-athens-gray-100 shadow-sm">
              <Button
                className="h-10 w-10 rounded-r-none p-1"
                disabled={page <= 0 || searchResults?.incomes !== undefined}
                variant="pagination"
                onClick={handleFetchPreviousPage}
              >
                <ChevronLeft size={20} />
              </Button>
              <div className="flex h-10 w-10 items-center justify-center border-x border-athens-gray-100 bg-white p-1">
                {page + 1}
              </div>
              <Button
                className="h-10 w-10 rounded-l-none p-1"
                variant="pagination"
                // eslint-disable-next-line @typescript-eslint/no-misused-promises
                onClick={handleFetchNextPage}
                disabled={!nextCursor || searchResults?.incomes !== undefined}
              >
                <ChevronRight size={20} />
              </Button>
            </div>
          </div>
        </div>
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

export default Income;
