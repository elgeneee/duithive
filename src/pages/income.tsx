import { type NextPage } from "next";
import { getSession, useSession } from "next-auth/react";
import AppLayout from "@/components/AppLayout";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
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
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { useState, useRef } from "react";
import {
  MoreVertical,
  Edit,
  Trash2,
  Loader2,
  Plus,
  CalendarIcon,
  DollarSign,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { api } from "@/utils/api";

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
  const [editDialogOpen, setEditDialogOpen] = useState<boolean>(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [editDate, setEditDate] = useState<Date | undefined>(new Date());
  const inputTitleRef = useRef<HTMLInputElement>(null);
  const inputDescriptionRef = useRef<HTMLInputElement>(null);
  const inputAmountRef = useRef<HTMLInputElement>(null);
  const ctx = api.useContext();

  const { data: userCurrency } = api.user.getUserCurrency.useQuery({
    email: session?.user?.email as string,
  });

  const { mutate: deleteIncome } = api.expense.deleteExpense.useMutation({
    onSuccess: () => {
      void ctx.income.getAll.invalidate();
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
  const { data: incomes } = api.income.getAll.useQuery();

  const { mutate: createIncome, isLoading: isCreatingIncome } =
    api.income.create.useMutation({
      onSuccess: () => {
        reset();
        setDialogOpen(false);
        void ctx.income.getAll.invalidate();
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

  const { mutate: editIncome, isLoading: isEditLoading } =
    api.income.editIncome.useMutation({
      onSuccess: () => {
        editReset;
        setEditDialogOpen(false);
        void ctx.income.getAll.invalidate();
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

  const onSubmit = (data: z.infer<typeof createIncomeSchema>) => {
    createIncome(data);
  };

  const onEditSubmit = (data: z.infer<typeof editIncomeSchema>) => {
    editIncome(data);
  };

  const handleDelete = (id: string) => {
    deleteIncome({ id: id });
  };

  return (
    <AppLayout>
      <main className="p-4">
        <h1 className="text-3xl font-bold">Income</h1>
        <div className="flex items-center justify-between">
          <p className="text-athens-gray-300">{formattedDate}</p>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus size={15} />
              <span className="ml-3">Add Income</span>
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
        </div>
        <div className="mt-10 space-y-5">
          {incomes?.map((income) => (
            <div
              key={income.id}
              className="flex items-center justify-between space-x-3 rounded-md bg-white p-3"
            >
              <div className="rounded-md bg-violet-400/30 p-3 text-violet-600">
                <DollarSign size={20} />
              </div>
              <div className="flex flex-1 justify-between">
                <div>
                  <p className="text-sm font-semibold">{income.title}</p>
                  <p className="text-sm font-normal text-[#A0A5AF]">
                    {income.description}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-semibold">
                    {userCurrency?.symbol}
                    {parseFloat(income.amount.toString()).toFixed(2)}
                  </p>
                  <p className="text-sm font-normal text-[#A0A5AF]">
                    {income.transactionDate.getDate() < 10
                      ? `0${income.transactionDate.getDate()}`
                      : income.transactionDate.getDate()}
                    /
                    {income.transactionDate.getMonth() < 10
                      ? `0${income.transactionDate.getMonth() + 1}`
                      : income.transactionDate.getMonth()}
                    /{income.transactionDate.getFullYear()}
                  </p>
                </div>
              </div>
              <Popover>
                <PopoverTrigger>
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
                  {/* edit dialog */}
                  <Dialog
                    open={editDialogOpen}
                    onOpenChange={setEditDialogOpen}
                  >
                    <button
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
                        setEditDialogOpen(true);
                      }}
                      className="flex w-full items-center justify-start space-x-2 rounded-md px-3 py-1 text-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                    >
                      <Edit className="h-4 w-4" />
                      <p className="text-sm">Edit</p>
                    </button>

                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Edit Income</DialogTitle>
                      </DialogHeader>
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
                            <span>Create</span>
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
                        <DialogTitle>Are you sure absolutely sure?</DialogTitle>
                        <DialogDescription>
                          This action cannot be undone. This will permanently
                          remove your income record from the system.
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
                          onClick={() => handleDelete(income.id)}
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
