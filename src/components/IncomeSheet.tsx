/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/restrict-plus-operands */
/* eslint-disable @typescript-eslint/restrict-template-expressions */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { useToast } from "@/components/ui/use-toast";
import { api } from "@/utils/api";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useForm } from "react-hook-form";
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

interface IncomeSheetProps {
  income: any;
  currency: any;
}

const editIncomeSchema = z.object({
  id: z.string(),
  title: z.string().min(1, { message: "Title must be at least 1 character" }),
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
});

export const IncomeSheet: React.FC<IncomeSheetProps> = ({
  income,
  currency,
}) => {
  const { toast } = useToast();

  const {
    handleSubmit: editHandleSubmit,
    formState: { errors: editErrors },
    setValue: editSetValue,
    reset: editReset,
  } = useForm<z.infer<typeof editIncomeSchema>>({
    resolver: zodResolver(editIncomeSchema),
  });

  const [editDate, setEditDate] = useState<Date | undefined>(new Date());
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
  const [sheetOpen, setSheetOpen] = useState<boolean>(false);
  const inputTitleRef = useRef<HTMLInputElement>(null);
  const inputDescriptionRef = useRef<HTMLInputElement>(null);
  const inputAmountRef = useRef<HTMLInputElement>(null);
  const ctx = api.useContext();

  const onEditSubmit = (data: z.infer<typeof editIncomeSchema>) => {
    editIncome(data);
  };

  const { mutate: editIncome, isLoading: isEditLoading } =
    api.income.editIncome.useMutation({
      onSuccess: (resp) => {
        editReset();
        setEditDate(resp.transactionDate);
        void ctx.income.getPaginated.invalidate();
        setSheetOpen(false);
        toast({
          variant: "success",
          status: "success",
          title: "Success!",
        });
      },
      onError: (e) => {
        const errorMessage = e.data?.zodError?.fieldErrors.content;
        setSheetOpen(false);
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

  const handleDelete = (id: string) => {
    deleteIncome({ id: id });
    setDeleteDialogOpen(false);
  };

  return (
    <Sheet key={income.id} open={sheetOpen} onOpenChange={setSheetOpen}>
      <SheetTrigger
        asChild
        onClick={() => {
          setEditDate(income.transactionDate);
          if (inputTitleRef.current) {
            inputTitleRef.current.defaultValue = income.title;
          }
          if (inputDescriptionRef.current) {
            inputDescriptionRef.current.defaultValue = income.description;
          }
          if (inputAmountRef.current) {
            inputAmountRef.current.defaultValue = income.amount.toString();
          }
          editSetValue("id", income.id);
          editSetValue("title", income.title)
          editSetValue("description", income.description);
          editSetValue("amount", parseFloat(income.amount.toString()));
          editSetValue("date", income.transactionDate);
        }}
      >
        <div className="flex items-center justify-between space-x-3 rounded-md border border-athens-gray-200/50 bg-white p-3 transition-colors duration-300 ease-in-out hover:cursor-pointer hover:bg-white/50">
          <div className="rounded-md bg-violet-400/30 p-3 text-violet-600">
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
              <line x1="12" x2="12" y1="2" y2="22" />
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
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
                {currency?.symbol}
                {parseFloat(income.amount.toString()).toFixed(2)}
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
                placeholder="Enter title"
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
                  defaultValue={parseFloat(income.amount.toString())}
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
                      your income record from the system.
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
