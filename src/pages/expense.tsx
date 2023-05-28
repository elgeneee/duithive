import { type NextPage } from "next";
import { getSession } from "next-auth/react";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Plus, CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Check, ChevronsUpDown } from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import { icons, categories } from "@/store/category";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { api } from "@/utils/api";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const expenseSchema = z.object({
  description: z
    .string()
    .min(5, { message: "Description must be at least 5 characters" }),
  amount: z.number({
    required_error: "Amount is required",
    invalid_type_error: "Amount must be a number",
  }),
  date: z.date(),
  category: z.object({
    id: z.number(),
    value: z.string(),
    label: z.string(),
    iconId: z.number(),
  }),
  imgUrl: z.string().optional(),
});

const Expense: NextPage = () => {
  const {
    register,
    reset,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<z.infer<typeof expenseSchema>>({
    // @typescript-eslint/no-unsafe-assignment
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      date: new Date(),
    },
  });

  const today = new Date();
  const formattedDate = today.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "2-digit",
  });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [iconId, setIconId] = useState<number>(1);
  const [open, setOpen] = useState(false);
  const [categoryValue, setCategoryValue] = useState<string>("");
  const [dispValue, setDispValue] = useState("");
  const ctx = api.useContext();

  const { mutate: createExpense, isLoading: loading } =
    api.expense.create.useMutation({
      onSuccess: () => {
        reset();
        setCategoryValue("");
        setDispValue("");
        setIconId(1);
        setDialogOpen(false);
        void ctx.expense.getAll.invalidate();
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

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { data: expenses, isLoading } =
    api.expense.getAll.useQuery();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDispValue(e.target.value);
  };

  const onSubmit = (data: z.infer<typeof expenseSchema>) => {
    createExpense(data);
  };

  return (
    <AppLayout>
      <main className="p-4">
        <h1 className="text-3xl font-bold">Expense</h1>
        <div className="flex items-center justify-between">
          <p className="text-athens-gray-300">{formattedDate}</p>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger>
              <Button>
                <Plus size={15} />
                <span className="ml-3">Add Expense</span>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Expense</DialogTitle>
              </DialogHeader>

              <form
                className="mt-10 space-y-3"
                // eslint-disable-next-line @typescript-eslint/no-misused-promises
                onSubmit={handleSubmit(onSubmit)}
              >
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
                    <p className="mb-2 text-sm">Category</p>
                    <Popover open={open} onOpenChange={setOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={open}
                          className="w-full justify-between"
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
                                                //???
                                                // const foundCategory =
                                                //   categories.find(
                                                //     (category) =>
                                                //       category.value === dispValue
                                                //   );

                                                // if (foundCategory) {
                                                //   foundCategory.iconId = icon.id;
                                                // } else {
                                                //   categories.push({
                                                //     id: categories.length + 1,
                                                //     value: dispValue,
                                                //     label: dispValue,
                                                //     iconId: icon.id,
                                                //   });
                                                // }
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
                <div>
                  <div className="flex flex-col">
                    <p className="mb-2 text-sm">Date</p>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-[240px] justify-start text-left font-normal",
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
                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? (
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
        <div className="space-y-5">
          {expenses?.map((expense) => (
            <div key={expense.id} className="bg-athens-gray-50">
              {expense.description}
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

export default Expense;
