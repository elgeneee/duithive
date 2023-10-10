import { type NextPage } from "next";
import { getSession, useSession } from "next-auth/react";
import AppLayout from "@/components/AppLayout";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ExpiredBadge } from "@/components/ui/expired-badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState, useRef, useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import {
  Check,
  ChevronsUpDown,
  ChevronRight,
  ChevronLeft,
  MoreVertical,
  Edit,
  FileStack,
  Trash2,
  Loader2,
  Plus,
  CalendarIcon,
} from "lucide-react";
import sumBy from "lodash/sumBy";
import debounce from "lodash/debounce";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { icons, categories } from "@/store/category";
import { useToast } from "@/components/ui/use-toast";
import { api } from "@/utils/api";
import { SkeletonList } from "@/components/ui/skeletonList";
import Link from "next/link";

const createBudgetSchema = z
  .object({
    title: z.string().min(1, { message: "Title must be at least 1 character" }),
    amount: z.number({
      required_error: "Amount is required",
      invalid_type_error: "Amount must be a number",
    }),
    category: z.object({
      id: z.number(),
      value: z.string(),
      label: z.string(),
      iconId: z.number(),
    }),
    startDate: z.date(),
    endDate: z.date(),
  })
  .refine((data) => data.startDate <= data.endDate, {
    path: ["endDate"],
    message: "StartDate shall precede deadline",
  });

const editBudgetSchema = z.object({
  id: z.string(),
  title: z.string().min(1, { message: "Title must be at least 1 character" }),
  amount: z.number({
    required_error: "Amount is required",
    invalid_type_error: "Amount must be a number",
  }),
});

const Budget: NextPage = () => {
  const { data: session } = useSession();
  const { toast } = useToast();
  const {
    handleSubmit: editHandleSubmit,
    formState: { errors: editErrors },
    setValue: editSetValue,
    reset: editReset,
  } = useForm<z.infer<typeof editBudgetSchema>>({
    resolver: zodResolver(editBudgetSchema),
  });

  const [dialogOpen, setDialogOpen] = useState<boolean>(false);
  const [editDialogOpen, setEditDialogOpen] = useState<boolean>(false);
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [deadline, setDeadline] = useState<Date | undefined>(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow;
  });
  const [open, setOpen] = useState<boolean>(false);
  const [categoryValue, setCategoryValue] = useState<string>("");
  const [dispValue, setDispValue] = useState<string>("");
  const [iconId, setIconId] = useState<number>(8);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
  const inputTitleRef = useRef<HTMLInputElement>(null);
  const inputAmountRef = useRef<HTMLInputElement>(null);

  //infiniteQuery
  const searchParams = useSearchParams();
  const selectedSize = searchParams.get("page_size");
  const [page, setPage] = useState<number>(0);
  const [dropdownOpen, setDropdownOpen] = useState<boolean>(false);

  //search function
  const [search, setSearch] = useState<string>("");

  const {
    register,
    reset,
    handleSubmit,
    formState: { errors, isSubmitting: isCreatingBudget },
    setValue,
  } = useForm<z.infer<typeof createBudgetSchema>>({
    resolver: zodResolver(createBudgetSchema),
    defaultValues: {
      startDate: date,
      endDate: deadline,
    },
  });

  const ctx = api.useContext();

  const today = new Date();

  const formattedDate = today.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "2-digit",
  });

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
  } = api.budget.search.useQuery({
    name: search,
    limit: selectedSize ? parseInt(selectedSize) : 10,
  });

  useEffect(() => {
    refetchSearch;
  }, [search, refetchSearch]);

  const {
    data: budgets,
    isLoading: isLoadingBudgets,
    fetchNextPage,
  } = api.budget.getPaginated.useInfiniteQuery(
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

  const { mutate: createBudget } = api.budget.create.useMutation({
    onSuccess: () => {
      reset();
      setCategoryValue("");
      setDispValue("");
      setIconId(1);
      setDialogOpen(false);
      void ctx.budget.getPaginated.invalidate();
      toast({
        variant: "success",
        status: "success",
        title: "Budget created successfully!",
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

  const { mutate: editBudget, isLoading: isEditLoading } =
    api.budget.editBudget.useMutation({
      onSuccess: () => {
        editReset;
        setEditDialogOpen(false);
        void ctx.budget.getPaginated.invalidate();
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

  const { mutate: deleteBudget } = api.budget.deleteBudget.useMutation({
    onSuccess: () => {
      void ctx.budget.getPaginated.invalidate();
      toast({
        variant: "success",
        status: "success",
        title: "Budget deleted successfully!",
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDispValue(e.target.value);
  };

  const onSubmit = (data: z.infer<typeof createBudgetSchema>) => {
    createBudget(data);
  };

  const onEditSubmit = (data: z.infer<typeof editBudgetSchema>) => {
    editBudget(data);
  };

  const handleDelete = (id: string) => {
    deleteBudget({ id: id });
  };

  const toShow = searchResults?.budgets
    ? searchResults.budgets
    : budgets?.pages[page]?.budgets;

  const nextCursor = budgets?.pages[page]?.nextCursor;

  return (
    <AppLayout>
      <main className="p-4">
        <h1 className="text-3xl font-bold">Budget</h1>
        <div className="flex flex-col items-start justify-between sm:flex-row sm:items-center">
          <p className="text-left text-athens-gray-300">{formattedDate}</p>
          <div className="flex w-full flex-col items-center space-x-0 space-y-2 sm:w-auto sm:flex-row sm:space-x-2 sm:space-y-0">
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <Button
                className="mt-10 w-full sm:mt-0 sm:w-64"
                onClick={() => {
                  setDate(new Date());
                  const tomorrow = new Date();
                  tomorrow.setDate(tomorrow.getDate() + 1);
                  setDeadline(tomorrow);
                  setDialogOpen(true);
                }}
              >
                <Plus size={15} />
                <span className="ml-3">Add Budget</span>
              </Button>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Budget</DialogTitle>
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
                  <div className="flex items-center space-x-3">
                    <div className="w-1/3">
                      <label className="text-sm">Budget</label>
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
                      <p className="mb-2 text-sm">Category</p>
                      <Popover open={open} onOpenChange={setOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={open}
                            className="w-full justify-between focus:outline-none focus:ring-2 focus:ring-violet-400 focus:ring-offset-1"
                          >
                            {categoryValue
                              ? categories.find(
                                  (category) => category.label === categoryValue
                                )?.value || categoryValue
                              : "Select category"}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-0">
                          <Command>
                            <CommandInput
                              placeholder="Search category..."
                              onChangeCapture={handleInputChange}
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
                                      value={dispValue}
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
                                                  icon.id === iconId
                                                    ? "bg-violet-500 text-primary-foreground"
                                                    : "hover:bg-muted "
                                                )}
                                                onClick={() => {
                                                  setIconId(icon.id);
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
                                    setCategoryValue(dispValue);
                                    setValue("category", {
                                      id: categories.length + 1,
                                      value: dispValue,
                                      label: dispValue,
                                      iconId: iconId,
                                    });
                                    categories.push({
                                      id: categories.length + 1,
                                      value: dispValue,
                                      label: dispValue,
                                      iconId: iconId,
                                    });
                                    setOpen(false);
                                  }}
                                  className="mt-2 inline w-full items-center justify-center rounded-md bg-violet-500 py-2 text-xs font-medium text-white"
                                >
                                  Create &quot;{dispValue}&quot;
                                </button>
                              </div>
                            </CommandEmpty>

                            {/* default cats */}
                            <CommandGroup>
                              {categories.map((category) => (
                                <CommandItem
                                  key={category.id}
                                  onSelect={(selectedCategory) => {
                                    setCategoryValue(
                                      selectedCategory === categoryValue
                                        ? ""
                                        : selectedCategory
                                    );
                                    setValue("category", {
                                      id: category.id,
                                      value: category.value,
                                      label: selectedCategory,
                                      iconId: category.iconId,
                                    });
                                    setOpen(false);
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      categoryValue === category.label
                                        ? "opacity-100"
                                        : "opacity-0"
                                    )}
                                  />
                                  {icons[category?.iconId - 1]?.icon}
                                  <span className="ml-3">{category.value}</span>
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </Command>
                        </PopoverContent>
                      </Popover>
                      <div className="h-3">
                        {errors.category && (
                          <span className="text-xxs text-red-500">
                            {errors.category.message}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-1/2">
                      <div className="flex flex-col">
                        <p className="mb-2 text-sm">StartDate</p>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full justify-start text-left font-normal"
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
                                setValue("startDate", data as Date);
                              }}
                              initialFocus
                              disabled={(date) => date < new Date("1900-01-01")}
                            />
                          </PopoverContent>
                        </Popover>
                        <div className="h-3">
                          {errors.startDate && (
                            <span className="text-xxs text-red-500">
                              {errors.startDate.message}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="w-1/2">
                      <div className="flex flex-col">
                        <p className="mb-2 text-sm">Deadline</p>
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
                              {deadline ? (
                                format(deadline, "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={deadline}
                              onSelect={(data) => {
                                setDeadline(data);
                                setValue("endDate", data as Date);
                              }}
                              initialFocus
                              disabled={(date) => date < new Date()}
                            />
                          </PopoverContent>
                        </Popover>
                        <div className="h-3">
                          {errors.endDate && (
                            <span className="text-xxs text-red-500">
                              {errors.endDate.message}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-[#A0A5AF]">
                    Note: Category, StartDate, and Deadline are not editable
                    after creation
                  </p>
                  <Button
                    type="submit"
                    disabled={isCreatingBudget}
                    className="w-full"
                  >
                    {isCreatingBudget ? (
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
              className="items-center border border-athens-gray-200 bg-white  bg-[url('/search.png')] bg-left bg-no-repeat pl-11"
              onChange={debouncedHandleInputChange}
              placeholder="Search..."
            />
          </div>
        </div>
        <div className="mt-10 space-y-5">
          {isLoadingBudgets || isLoadingSearchResults ? (
            <SkeletonList className="h-[80px]" />
          ) : (
            <>
              {toShow && toShow?.length > 0 ? (
                <>
                  {toShow?.map((budget) => (
                    <div
                      key={budget.id}
                      className={cn(
                        budget.endDate < new Date() &&
                          "bg-opacity-60 text-black text-opacity-30",
                        "flex items-center justify-between space-x-3 rounded-md bg-white p-3"
                      )}
                    >
                      <div className="flex w-full items-center justify-between">
                        <div
                          className={cn(
                            budget.endDate < new Date() &&
                              "bg-opacity-10 text-opacity-30",
                            "mr-8 flex h-16 w-16 items-center justify-center rounded-md bg-violet-400/30 p-3 text-violet-600"
                          )}
                        >
                          {
                            icons.find(
                              (icon) => icon.id === budget.category?.iconId
                            )?.icon
                          }
                        </div>
                        <div className="flex w-full flex-col">
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="flex items-center space-x-4">
                                <p className="font-satoshi text-lg font-bold">
                                  {budget.title}
                                </p>
                                <Badge
                                  variant={
                                    parseFloat(budget.amount.toString()) <
                                    sumBy(budget.expenses, (item) =>
                                      parseFloat(item.amount.toString())
                                    )
                                      ? "destructive"
                                      : "success"
                                  }
                                >
                                  {parseFloat(budget.amount.toString()) <
                                  sumBy(budget.expenses, (item) =>
                                    parseFloat(item.amount.toString())
                                  )
                                    ? "Exceeded"
                                    : "On Track"}
                                </Badge>
                              </span>
                              <span className="flex items-center space-x-2">
                                <p
                                  className={cn(
                                    budget.endDate < new Date() &&
                                      "text-opacity-30",
                                    "font-base text-xs text-[#9e9e9e]"
                                  )}
                                >
                                  Ends at{" "}
                                  {budget.endDate.getDate() < 10
                                    ? `0${budget.endDate.getDate()}`
                                    : budget.endDate.getDate()}
                                  /
                                  {budget.endDate.getMonth() < 10
                                    ? `0${budget.endDate.getMonth() + 1}`
                                    : budget.endDate.getMonth()}
                                  /{budget.endDate.getFullYear()}
                                </p>
                                {budget.endDate < new Date() && (
                                  <ExpiredBadge>Expired</ExpiredBadge>
                                )}
                              </span>
                            </div>
                            <p className="font-satoshi text-sm font-semibold">
                              Budget {userCurrency?.symbol}
                              {parseFloat(budget.amount.toString()).toFixed(2)}
                            </p>
                          </div>
                          <Progress
                            value={
                              (sumBy(budget.expenses, (item) =>
                                parseFloat(item.amount.toString())
                              ) /
                                parseFloat(budget.amount.toString())) *
                              100
                            }
                            className="my-2"
                            customProp={
                              budget.endDate < new Date() ? "bg-opacity-30" : ""
                            }
                          />
                          <div className="flex items-center justify-between">
                            <p className="font-satoshi text-sm font-semibold">
                              Spent {userCurrency?.symbol}
                              {sumBy(budget.expenses, (item) =>
                                parseFloat(item.amount.toString())
                              ).toFixed(2)}
                            </p>
                            <p className="font-satoshi text-sm font-semibold">
                              Remaining: {userCurrency?.symbol}
                              {Math.max(
                                0,
                                parseFloat(budget.amount.toString()) -
                                  sumBy(budget.expenses, (item) =>
                                    parseFloat(item.amount.toString())
                                  )
                              ).toFixed(2)}
                            </p>
                          </div>
                          {budget.expenses.length > 0 && (
                            <div className="mt-4">
                              <Accordion type="single" collapsible>
                                <AccordionItem value="item-1">
                                  <AccordionTrigger>
                                    <span
                                      className={cn(
                                        budget.endDate < new Date() &&
                                          "text-opacity-40",
                                        "flex items-center space-x-2 text-athens-gray-400"
                                      )}
                                    >
                                      <FileStack size={20} />
                                      <span>
                                        Expenses ({budget.expenses.length})
                                      </span>
                                    </span>
                                  </AccordionTrigger>
                                  <AccordionContent>
                                    <div className="divide-y">
                                      {budget.expenses.map((expense, index) => (
                                        <div
                                          key={expense.id}
                                          className={cn(
                                            index % 2 === 0 && "",
                                            "flex justify-between space-y-1 rounded-lg px-3 py-1"
                                          )}
                                        >
                                          <div>
                                            <p className="font-medium">
                                              {expense.description}
                                            </p>
                                            <p className="text-xs text-[#A0A5AF]">
                                              {expense.transactionDate.toLocaleDateString(
                                                "en-US",
                                                {
                                                  month: "long",
                                                  day: "numeric",
                                                  year: "numeric",
                                                }
                                              )}
                                            </p>
                                          </div>
                                          <p className="text-sm font-medium">
                                            -{userCurrency?.symbol}
                                            {parseFloat(
                                              expense.amount.toString()
                                            ).toFixed(2)}
                                          </p>
                                        </div>
                                      ))}
                                    </div>
                                  </AccordionContent>
                                </AccordionItem>
                              </Accordion>
                            </div>
                          )}
                        </div>
                      </div>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="ghostSecondary"
                            className="h-8 w-8 rounded-md p-0"
                          >
                            <MoreVertical className="h-4 w-4" />
                            <span className="sr-only">Open popover</span>
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="flex w-36 flex-col p-2">
                          <p className="px-2 text-sm font-medium text-foreground">
                            Edit/Delete
                          </p>
                          <Separator className="my-2" />
                          <Dialog
                            open={editDialogOpen}
                            onOpenChange={setEditDialogOpen}
                          >
                            <button
                              onClick={() => {
                                if (inputTitleRef.current) {
                                  inputTitleRef.current.defaultValue =
                                    budget.title;
                                }
                                if (inputAmountRef.current) {
                                  inputAmountRef.current.defaultValue =
                                    budget.amount.toString();
                                }
                                editSetValue("id", budget.id);
                                editSetValue("title", budget.title);
                                editSetValue(
                                  "amount",
                                  parseFloat(budget.amount.toString())
                                );
                                setEditDialogOpen(true);
                              }}
                              className="flex w-full items-center justify-start space-x-2 rounded-md px-3 py-1 text-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                            >
                              <Edit className="h-4 w-4" />
                              <p className="text-sm">Edit</p>
                            </button>

                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Edit Budget</DialogTitle>
                              </DialogHeader>
                              <form
                                className="mt-3"
                                // eslint-disable-next-line @typescript-eslint/no-misused-promises
                                onSubmit={editHandleSubmit(onEditSubmit)}
                              >
                                <div>
                                  <label className="text-sm">Title</label>
                                  <Input
                                    className="mt-2 border border-input bg-white hover:bg-accent hover:text-accent-foreground"
                                    placeholder="Enter description"
                                    defaultValue={budget.title}
                                    onChange={(e) => {
                                      editSetValue("title", e.target.value);
                                    }}
                                    ref={inputTitleRef}
                                  />

                                  <div className="h-3">
                                    {editErrors.title && (
                                      <span className="text-xxs text-red-500">
                                        {editErrors.title.message}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center space-x-3">
                                  <div className="w-1/3">
                                    <label className="text-sm">Budget</label>
                                    <Input
                                      className="mt-2 border border-input bg-white hover:bg-accent hover:text-accent-foreground"
                                      placeholder="Enter amount"
                                      defaultValue={parseFloat(
                                        budget.amount.toString()
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
                                    <label className="mb-2 text-sm">
                                      Category
                                    </label>
                                    <Button
                                      variant="disabled"
                                      disabled
                                      role="combobox"
                                      className="mt-2 w-full justify-start text-left font-normal"
                                    >
                                      {
                                        categories.find(
                                          (category) =>
                                            category.value ===
                                            budget?.category?.name
                                        )?.value
                                      }
                                    </Button>
                                    <div className="h-3"></div>
                                  </div>
                                </div>
                                <div className="flex space-x-3">
                                  <div className="w-1/2">
                                    <div className="flex flex-col">
                                      <p className="mb-2 text-sm">StartDate</p>
                                      <Button
                                        type="button"
                                        disabled
                                        variant={"disabled"}
                                        className="w-full justify-start text-left font-normal"
                                      >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {format(budget.startDate, "PPP")}
                                      </Button>
                                    </div>
                                  </div>
                                  <div className="w-1/2">
                                    <div className="flex flex-col">
                                      <p className="mb-2 text-sm">Deadline</p>
                                      <Button
                                        type="button"
                                        disabled
                                        variant={"disabled"}
                                        className="w-full justify-start text-left font-normal"
                                      >
                                        <CalendarIcon className="mr-2 h-4 w-4" />

                                        {format(budget.endDate, "PPP")}
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                                <Button
                                  type="submit"
                                  disabled={isEditLoading}
                                  className="mt-6 w-full"
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
                            </DialogContent>
                          </Dialog>
                          <Dialog
                            open={deleteDialogOpen}
                            onOpenChange={setDeleteDialogOpen}
                          >
                            <DialogTrigger>
                              <button className="flex w-full items-center justify-start space-x-2 rounded-md px-3 py-1 text-red-400 transition-colors hover:bg-accent hover:text-red-500">
                                <Trash2 className="h-4 w-4" />
                                <p className="text-sm">Delete</p>
                              </button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>
                                  Are you absolutely sure?
                                </DialogTitle>
                                <DialogDescription>
                                  This action cannot be undone. This will
                                  permanently remove your expense record from
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
                                  onClick={() => handleDelete(budget.id)}
                                >
                                  Delete
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        </PopoverContent>
                      </Popover>
                    </div>
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
                    No budgets yet
                  </p>
                </div>
              )}
            </>
          )}
          <div className="flex justify-end">
            <div className="flex border border-athens-gray-100 shadow-sm">
              <Button
                className="h-10 w-10 rounded-r-none p-1"
                disabled={page <= 0 || searchResults?.budgets !== undefined}
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
                disabled={!nextCursor || searchResults?.budgets !== undefined}
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

export default Budget;
