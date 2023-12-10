/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { type NextPage } from "next";
import { getSession } from "next-auth/react";
import AppLayout from "@/components/AppLayout";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { BackButton } from "@/components/ui/back-button";
import { useState } from "react";
import { z } from "zod";
import { api } from "@/utils/api";
import { useToast } from "@/components/ui/use-toast";
import * as xlsx from "xlsx";
import Image from "next/image";
import { MotionConfig, motion } from "framer-motion";
import useMeasure from "react-use-measure";
import { DataTable } from "@/components/ui/data-table";
import { columns } from "@/components/ui/uploadedRecordsColumns";

const xlsxSchema = z.object({
  Description: z
    .string()
    .min(5, { message: "Description must be at least 5 characters" }),
  Amount: z
    .number({
      required_error: "Amount is required",
      invalid_type_error: "Amount must be a number",
    })
    .min(0, { message: "Must be greater than 0" }),
  Category: z.enum([
    "Restaurants",
    "Shopping",
    "Sports",
    "Transport",
    "Groceries",
    "Entertainment",
    "Auto",
  ]),
  Date: z.date(),
  Image: z.string().optional(),
});

const BatchExpense: NextPage = () => {
  const { toast } = useToast();

  const today = new Date();
  const formattedDate = today.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "2-digit",
  });

  //drag-and-drop file
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [fileSizeTooBig, setFileSizeTooBig] = useState<boolean>(false);
  const [fileIsNotExcel, setFileIsNotExcel] = useState<boolean>(false);
  const [successRecords, setSuccessRecords] = useState<any[]>([]);
  const [failedRecords, setFailedRecords] = useState<any[]>([]);
  const [dragActive, setDragActive] = useState<boolean>(false);

  const [ref, { height }] = useMeasure();

  const ctx = api.useContext();

  // const delay = (ms: number | undefined) =>
  //   new Promise((res) => setTimeout(res, ms));

  const { data: recordsData } = api.expense.getBatchExpense.useQuery();

  const { mutate: createBatchExpense, isLoading: isBatchCreateLoading } =
    api.expense.createBatchExpense.useMutation({
      onSuccess: () => {
        setExcelFile(null);
        setSuccessRecords([]);
        setFailedRecords([]);
        toast({
          variant: "success",
          status: "success",
          title: "Success!",
        });
        void ctx.expense.getBatchExpense.invalidate();
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
    setFileIsNotExcel(false);
    setExcelFile(null);
    const success: any[] = [];
    const failed: any[] = [];
    const file = e.dataTransfer.files && e.dataTransfer.files[0];
    if (file) {
      if (file.size / 1024 / 1024 > 5) {
        setFileSizeTooBig(true);
        setExcelFile(null);
      } else if (
        file.type !==
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      ) {
        setFileIsNotExcel(true);
        setExcelFile(null);
      } else {
        setExcelFile(file);
        let data;
        const reader = new FileReader();
        reader.readAsArrayBuffer(file);
        reader.onload = (e) => {
          const workbook = xlsx.read(e.target?.result, {
            type: "buffer",
            cellDates: true,
          });
          const worksheet = workbook.Sheets["Sheet1"] as xlsx.WorkSheet;
          data = xlsx.utils.sheet_to_json(worksheet, {
            dateNF: "dd-mm-yyyy",
          });
          data.splice(0, 2);
          //perform validation
          data.forEach((row: any) => {
            if (row.Description) {
              row.Description = row.Description.toString();
            }
            if (row.Date) {
              const newDate = row.Date.toString();
              const [day, month, year] = newDate.split("/");
              // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
              const dateObject = new Date(`${year}-${month}-${day}`);
              row.Date = dateObject;
            }

            if (row.Image) {
              row.Image = row.Image.toString();
              if (
                row.Image.match(
                  /^http[^\?]*.(jpg|jpeg|gif|png|tiff|bmp|webp)(\?(.*))?$/gim
                ) == null
              ) {
                delete row.Image;
              }
            }

            //perform zod validation
            const res = xlsxSchema.safeParse(row);
            if (!res.success) {
              failed.push(res.error.issues);
            } else {
              success.push(row);
            }
          });
          setSuccessRecords(success);
          setFailedRecords(failed);
        };
      }
    }
  };

  const handleFileSubmit = () => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    createBatchExpense({
      fileName: excelFile?.name as string,
      records: successRecords,
    });
  };

  const deleteFile = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setExcelFile(null);
    setSuccessRecords([]);
    setFailedRecords([]);
  };

  const onChangeFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileSizeTooBig(false);
    setFileIsNotExcel(false);
    setExcelFile(null);
    const success: any[] = [];
    const failed: any[] = [];

    const file = e.currentTarget.files && e.currentTarget.files[0];
    if (file) {
      if (file.size / 1024 / 1024 > 5) {
        setFileSizeTooBig(true);
        setExcelFile(null);
      } else if (
        file.type !==
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      ) {
        setFileIsNotExcel(true);
        setExcelFile(null);
      } else {
        setExcelFile(file);
        let data;
        const reader = new FileReader();
        reader.readAsArrayBuffer(file);
        reader.onload = (e) => {
          const workbook = xlsx.read(e.target?.result, {
            type: "buffer",
            cellDates: true,
          });
          const worksheet = workbook.Sheets["Sheet1"] as xlsx.WorkSheet;
          data = xlsx.utils.sheet_to_json(worksheet, {
            dateNF: "dd-mm-yyyy",
          });
          data.splice(0, 2);
          //perform validation
          data.forEach((row: any) => {
            if (row.Description) {
              row.Description = row.Description.toString();
            }
            if (row.Date) {
              const newDate = row.Date.toString();
              const [day, month, year] = newDate.split("/");
              // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
              const dateObject = new Date(`${year}-${month}-${day}`);
              row.Date = dateObject;
            }

            if (row.Image) {
              row.Image = row.Image.toString();
              if (
                row.Image.match(
                  /^http[^\?]*.(jpg|jpeg|gif|png|tiff|bmp|webp)(\?(.*))?$/gim
                ) == null
              ) {
                delete row.Image;
              }
            }

            //perform zod validation
            const res = xlsxSchema.safeParse(row);
            if (!res.success) {
              failed.push(res.error.issues);
            } else {
              success.push(row);
            }
          });
          setSuccessRecords(success);
          setFailedRecords(failed);
        };
      }
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) {
      return bytes.toString() + " B";
    } else if (bytes < 1024 * 1024) {
      return (bytes / 1024).toFixed(2) + " KB";
    } else {
      return (bytes / (1024 * 1024)).toFixed(2) + " MB";
    }
  };

  return (
    <AppLayout>
      <MotionConfig transition={{ duration: 0.2 }}>
        <main className="p-4">
          <BackButton href="/expense" className="mb-10">
            Expense
          </BackButton>
          <h1 className="text-3xl font-bold">Batch Upload Expenses</h1>
          <div className="flex flex-col items-start justify-between sm:flex-row sm:items-center">
            <p className="text-left text-athens-gray-300 ">{formattedDate}</p>
          </div>
          <div className="mt-10 space-y-5">
            <div className="rounded-md bg-white p-4">
              <p className="mb-2 text-lg font-bold">
                Step 1: Download Template
              </p>
              <p className="text-[#A0A5AF]">
                Please download the expense template first
              </p>
              <a
                href="/DuitHive_Expense_Template.xlsx"
                className="group mt-10 inline-flex h-10 w-full items-center justify-center space-x-2 rounded-md bg-violet-500 px-4 py-2 text-sm font-medium text-primary-foreground ring-offset-background transition-colors hover:bg-violet-500/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 active:bg-violet-500/80 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-opacity-50 sm:w-72"
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
                  className="h-4 w-4 transition duration-300 ease-in-out group-hover:scale-110"
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" x2="12" y1="15" y2="3" />
                </svg>
                <span>Download</span>
              </a>
            </div>
            <div className="h-auto transform rounded-md bg-white p-4">
              <p className="mb-2 text-lg font-bold">Step 2: Upload Template</p>
              <p className="text-[#A0A5AF]">
                Upload a pre-filled expense template file.
              </p>
              <motion.div animate={{ height }} className="">
                <div ref={ref}>
                  {excelFile ? (
                    <motion.div
                      className="mt-10"
                      initial={{ opacity: 0.8 }}
                      animate={{ opacity: 1 }}
                    >
                      <div className="relative flex w-full space-x-5 rounded-md border border-athens-gray-200/40 bg-athens-gray-100/60 py-3 pl-3 pr-6  transition duration-500 animate-in fade-in slide-in-from-top-2 sm:w-72">
                        <Image
                          src={"/excel-icon.png"}
                          alt="excel icon"
                          width={30}
                          height={30}
                          className="aspect-square"
                        />
                        <div className="line-clamp-1 flex flex-col">
                          <p className="text-xs font-medium">
                            {excelFile.name}
                          </p>
                          <p className="text-xs font-normal text-athens-gray-400">
                            {formatFileSize(excelFile.size)}
                          </p>
                        </div>
                        <button
                          onClick={deleteFile}
                          className="absolute right-1 top-0 m-1 rounded-full p-1 transition duration-200 hover:bg-athens-gray-500/10"
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
                            className="h-3 w-3"
                          >
                            <path d="M18 6 6 18" />
                            <path d="m6 6 12 12" />
                          </svg>
                        </button>
                      </div>

                      {
                        //success message
                        successRecords.length > 0 && (
                          <div className="mt-3 w-fit rounded-sm bg-green-200/50 px-3 py-1 text-xs duration-1000 animate-in fade-in-50 slide-in-from-top-2">
                            <div className="flex items-center space-x-3">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="15"
                                height="15"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="lucide lucide-check-circle-2 text-green-500"
                              >
                                <motion.path
                                  initial={{ pathLength: 0, opacity: 0.7 }}
                                  animate={{ pathLength: 1, opacity: 1 }}
                                  transition={{
                                    duration: 0.5,
                                    delay: 0.25,
                                    ease: "easeInOut",
                                  }}
                                  d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"
                                />
                                <motion.path
                                  initial={{ pathLength: 0, opacity: 0.7 }}
                                  animate={{ pathLength: 1, opacity: 1 }}
                                  transition={{
                                    duration: 0.5,
                                    delay: 0.25,
                                    ease: "easeInOut",
                                  }}
                                  d="m9 12 2 2 4-4"
                                />
                              </svg>
                              <span>
                                {successRecords.length} successful entry(s)
                              </span>
                            </div>
                          </div>
                        )
                      }
                      {
                        //error message
                        failedRecords.length > 0 && (
                          <div className="mt-3 w-fit rounded-sm bg-red-200/50 px-3 py-1 text-xs duration-1000 animate-in fade-in-50 slide-in-from-top-2">
                            <div className="flex items-center space-x-3">
                              {/* <XCircle size={15} className="text-red-500" /> */}
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="15"
                                height="15"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="lucide lucide-x-circle text-red-500"
                              >
                                <motion.circle
                                  initial={{ pathLength: 0, opacity: 0.7 }}
                                  animate={{ pathLength: 1, opacity: 1 }}
                                  transition={{
                                    duration: 0.5,
                                    delay: 0.25,
                                    ease: "easeInOut",
                                  }}
                                  cx="12"
                                  cy="12"
                                  r="10"
                                />
                                <motion.path
                                  initial={{ pathLength: 0, opacity: 0.7 }}
                                  animate={{ pathLength: 1, opacity: 1 }}
                                  transition={{
                                    duration: 0.5,
                                    delay: 0.25,
                                    ease: "easeInOut",
                                  }}
                                  d="m15 9-6 6"
                                />
                                <motion.path
                                  initial={{ pathLength: 0, opacity: 0.7 }}
                                  animate={{ pathLength: 1, opacity: 1 }}
                                  transition={{
                                    duration: 0.5,
                                    delay: 0.25,
                                    ease: "easeInOut",
                                  }}
                                  d="m9 9 6 6"
                                />
                              </svg>
                              <span>
                                {failedRecords.length} failed entry(s)
                              </span>
                            </div>
                          </div>
                        )
                      }
                      <Button
                        className="mt-10 w-full text-center transition duration-1000 animate-in fade-in-20 slide-in-from-top-1 sm:w-44"
                        onClick={handleFileSubmit}
                        disabled={isBatchCreateLoading}
                      >
                        {isBatchCreateLoading ? (
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
                          <span>Submit</span>
                        )}
                      </Button>
                    </motion.div>
                  ) : (
                    <div className="z-[9999] mt-10 duration-1000 animate-in fade-in-20">
                      <label
                        htmlFor="xlsx-upload"
                        className={cn(
                          "group relative mx-auto flex h-32 w-full flex-col items-center justify-center rounded-lg transition duration-100 hover:border-[#a9adb1]/80",
                          dragActive
                            ? "border-2 border-violet-500 bg-violet-500 bg-opacity-30"
                            : "border-2 border-dashed border-[#D0D2D4]"
                        )}
                      >
                        {fileSizeTooBig && (
                          <p className="z-[500] text-xs text-red-500">
                            File size too big (less than 5MB)
                          </p>
                        )}
                        {fileIsNotExcel && (
                          <p className="z-[500] text-xs text-red-500">
                            File is not an excel file
                          </p>
                        )}
                        <div
                          onDragOver={handleDragOver}
                          onDragEnter={handleDragOver}
                          onDragLeave={handleDragLeave}
                          onDrop={handleDrop}
                          className={cn(
                            "absolute aspect-video h-full w-full rounded-md object-cover",
                            dragActive ? "z-[400] " : "z-40 bg-white"
                          )}
                        />
                        <div className="absolute z-50 flex items-center justify-center space-x-5 text-center text-xs font-medium transition-all duration-100">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="30"
                            height="30"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="lucide lucide-upload text-[#A0A5AF]"
                          >
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                            <polyline
                              className={cn(
                                "translate-y-0 transition duration-300 ease-in-out group-hover:-translate-y-[2px]",
                                dragActive && "-translate-y-[2px]"
                              )}
                              points="17 8 12 3 7 8"
                            />
                            <line
                              className={cn(
                                "translate-y-0 transition duration-300 ease-in-out group-hover:-translate-y-[2px]",
                                dragActive && "-translate-y-[2px]"
                              )}
                              x1="12"
                              x2="12"
                              y1="3"
                              y2="15"
                            />
                          </svg>
                          <div>
                            <p className="text-sm font-normal text-black">
                              Drag and drop your Excel file here or{" "}
                              <span className="font-medium text-violet-600 hover:cursor-pointer hover:underline">
                                select a file
                              </span>
                            </p>
                            <p className="text-left text-sm font-light text-[#A0A5AF]">
                              Maximum Size: 5MB
                            </p>
                          </div>
                        </div>
                      </label>
                      <div className="z-30 mt-1 flex rounded-md shadow-lg">
                        <input
                          id="xlsx-upload"
                          name="image"
                          type="file"
                          accept="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                          className="sr-only"
                          onChange={onChangeFile}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
            <div className="rounded-md bg-white p-4">
              <p className="mb-4 text-lg font-bold">Uploaded Records</p>
              <DataTable columns={columns} data={recordsData || []} />
            </div>
          </div>
        </main>
      </MotionConfig>
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

export default BatchExpense;
