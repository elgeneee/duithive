/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-misused-promises */
import { type NextPage } from "next";
import { getSession, useSession } from "next-auth/react";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { DataTable } from "@/components/ui/data-table";
import React, { useState } from "react";
import { CalendarIcon, Download, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { addDays, format } from "date-fns";
import { pdf, Document, Page, Text, View, Image } from "@react-pdf/renderer";
import { type DateRange } from "react-day-picker";
import { PieChart, Pie, Cell } from "recharts";
import { api } from "@/utils/api";
import ReactPDFChart from "react-pdf-charts";
import groupBy from "lodash/groupBy";
import map from "lodash/map";
import sumBy from "lodash/sumBy";
import { reportStyles as styles } from "@/store/reportStyles";
import { columns } from "@/components/ui/reportColumns";
import { customAlphabet } from "nanoid";
import { useToast } from "@/components/ui/use-toast";

const colors: string[] = [
  "#9D74F3",
  "#6DC8FC",
  "#DFD7FD",
  "#6FCF97",
  "#803FE8",
  "#AB8EF7",
];

const Report: NextPage = () => {
  const { data: session } = useSession();
  const { toast } = useToast();

  const [dateRange, setDateRange] = useState<string>("week");
  const [date, setDate] = useState<DateRange | undefined>({
    from: new Date(),
    to: addDays(new Date(), 7),
  });
  const [loading, setLoading] = useState<boolean>(false);
  const ctx = api.useContext();

  const { data: expenses, refetch } = api.expense.getExpenseReport.useQuery({
    startDate: date?.from,
    endDate: date?.to,
  });

  const { data: userCurrency } = api.user.getUserCurrency.useQuery({
    email: session?.user?.email as string,
  });

  const { data: reports } = api.report.getAll.useQuery();

  const { mutate: createReport } = api.report.create.useMutation({
    onSuccess: () => {
      setLoading(false);
      void ctx.report.getAll.invalidate();
      toast({
        variant: "success",
        status: "success",
        title: "Report generated successfully!",
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

  const today = new Date();

  const formattedDate = today.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "2-digit",
  });

  const setFilter = (filterValue: string) => {
    switch (filterValue) {
      case "week":
        const currentDayOfWeek = new Date().getDay();
        const firstDayOfWeek = new Date(new Date());
        firstDayOfWeek.setDate(new Date().getDate() - currentDayOfWeek);
        setDateRange("week");
        setDate({
          from: firstDayOfWeek,
          to: addDays(firstDayOfWeek, 6),
        });
        break;
      case "month":
        const startOfMonth = new Date();
        startOfMonth.setDate(1);

        const endOfMonth = new Date();
        endOfMonth.setMonth(endOfMonth.getMonth() + 1);
        endOfMonth.setDate(0);

        setDateRange("month");
        setDate({
          from: startOfMonth,
          to: endOfMonth,
        });
        break;
      case "year":
        const startOfYear = new Date();
        startOfYear.setMonth(0);
        startOfYear.setDate(1);

        const endOfYear = new Date();
        endOfYear.setMonth(11);
        endOfYear.setDate(31);
        setDateRange("year");
        setDate({
          from: startOfYear,
          to: endOfYear,
        });
        break;
    }
  };

  const expenseReport = async () => {
    await refetch();

    const groupedData = map(
      groupBy(expenses, (item) => item?.category?.name),
      //group - array of items
      //category - key name
      (group, category) => ({
        category: category,
        totalAmount: sumBy(group, (item) => parseFloat(item.amount.toString())),
      })
    );

    return (
      <Document>
        <Page size="A4" style={styles.page}>
          <View style={styles.header}>
            <View style={styles.section}>
              {/* eslint-disable-next-line jsx-a11y/alt-text */}
              <Image
                src="https://res.cloudinary.com/dlidl2li4/image/upload/v1686925035/DuitHive/Group_3_paqhen.png"
                style={styles.logo}
                cache={false}
              />
              <View style={styles.dateView}>
                <Text style={styles.dateText}>
                  {date?.from?.toLocaleDateString()} -{" "}
                  {date?.to?.toLocaleDateString()}
                </Text>
              </View>
              <View style={{ marginTop: 20 }}>
                {groupedData.map((item, index) => (
                  <View key={index} style={styles.chartLabels}>
                    <View
                      style={{
                        width: 15,
                        height: 15,
                        // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
                        backgroundColor: `${colors[index]}`,
                      }}
                    />
                    <Text
                      style={[
                        styles.text,
                        {
                          marginLeft: 5,
                        },
                      ]}
                    >
                      {item.category}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
            <View style={styles.chart}>
              <ReactPDFChart>
                <PieChart width={730} height={250} id="piechart">
                  <Pie
                    isAnimationActive={false}
                    data={groupedData}
                    dataKey="totalAmount"
                    nameKey="category"
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    fill="#82ca9d"
                  >
                    {groupedData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={colors[index]} />
                    ))}
                  </Pie>
                </PieChart>
              </ReactPDFChart>
            </View>
          </View>
          {/* Header row */}
          {expenses && expenses?.length > 0 && (
            <View style={styles.tableHeader}>
              <View style={styles.cell}>
                <Text
                  style={[
                    styles.text,
                    {
                      fontWeight: "extrabold",
                    },
                  ]}
                >
                  Name
                </Text>
              </View>
              <View style={styles.cell}>
                <Text style={styles.text}>Date</Text>
              </View>
              <View style={styles.cell}>
                <Text style={styles.text}>Category</Text>
              </View>
              <View
                style={[
                  styles.cell,
                  {
                    justifyContent: "flex-end",
                  },
                ]}
              >
                <Text
                  style={[
                    styles.text,
                    {
                      textAlign: "right",
                    },
                  ]}
                >
                  Amount
                </Text>
              </View>
            </View>
          )}
          {expenses?.map((item, index) => (
            <View key={index} style={styles.dataRow}>
              <View style={styles.cell}>
                <Text style={styles.text}>{item.description}</Text>
              </View>
              <View style={styles.cell}>
                <Text style={styles.text}>
                  {item.transactionDate.toLocaleDateString()}
                </Text>
              </View>
              <View style={styles.cell}>
                <Text style={styles.text}>{item.category?.name}</Text>
              </View>
              <View style={styles.cell}>
                <Text
                  style={[
                    styles.text,
                    {
                      textAlign: "right",
                    },
                  ]}
                >
                  {parseFloat(item.amount.toString()).toFixed(2)}
                </Text>
              </View>
            </View>
          ))}
          {expenses && expenses.length > 0 && (
            <View style={{ flexDirection: "row" }}>
              <View style={styles.cell}></View>
              <View style={styles.cell}></View>
              <View style={styles.cell}></View>
              <View style={styles.totalCell}>
                <Text style={styles.totalText}>
                  Total: {userCurrency?.symbol}
                  {sumBy(expenses, (item) =>
                    parseFloat(item.amount.toString())
                  ).toFixed(2)}
                </Text>
              </View>
            </View>
          )}
        </Page>
      </Document>
    );
  };

  const generateRandomString = customAlphabet(
    "1234567890abcdefghijklmnopqrstuvwxyz",
    7
  );

  const generatePDF = async () => {
    try {
      setLoading(true);
      const report = await expenseReport();
      const blobPdf = await pdf(report).toBlob();
      console.log(blobPdf)
      const pdfURL = URL.createObjectURL(blobPdf);
      window.open(pdfURL, "_blank");

      const randomString = generateRandomString();

      const formData = new FormData();
      formData.append("file", blobPdf);
      formData.append("upload_preset", "oxd8flh9");
      formData.append(
        "public_id",
        `duithive_report_${today.getFullYear()}${String(
          today.getMonth() + 1
        ).padStart(2, "0")}${String(today.getDate()).padStart(
          2,
          "0"
        )}_${randomString}`
      );
      formData.append(
        "folder",
        `duithive/users/${session?.user?.email as string}/report`
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

      //upload to db
      createReport({
        fileName: `duithive_report_${today.getFullYear()}${String(
          today.getMonth() + 1
        ).padStart(2, "0")}${String(today.getDate()).padStart(
          2,
          "0"
        )}_${randomString}.pdf`,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
        url: cloudinaryResponse.secure_url,
      });
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <AppLayout>
      <main className="p-4">
        <h1 className="text-3xl font-bold">Report</h1>
        <div className="flex items-center justify-between">
          <p className="text-athens-gray-300">{formattedDate}</p>
        </div>
        <div className="mt-10 w-full space-y-5 rounded-md bg-white p-4 sm:w-1/2">
          <div className="flex flex-col items-center space-x-0 space-y-3 sm:flex-row sm:space-x-4 sm:space-y-0">
            <button
              className={cn(
                dateRange == "week"
                  ? "bg-violet-500 text-primary-foreground"
                  : "border border-violet-500 bg-white text-violet-500",
                "inline-flex h-10 w-full items-center justify-center rounded-md px-4 py-2 text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:bg-opacity-50 sm:w-auto"
              )}
              onClick={() => {
                setFilter("week");
              }}
            >
              This Week
            </button>
            <button
              className={cn(
                dateRange == "month"
                  ? "bg-violet-500 text-primary-foreground"
                  : "border border-violet-500 bg-white text-violet-500",
                "inline-flex h-10 w-full items-center justify-center rounded-md px-4 py-2 text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:bg-opacity-50 sm:w-auto"
              )}
              onClick={() => {
                setFilter("month");
              }}
            >
              This Month
            </button>
            <button
              className={cn(
                dateRange == "year"
                  ? "bg-violet-500 text-primary-foreground"
                  : "border border-violet-500 bg-white text-violet-500",
                "inline-flex h-10 w-full items-center justify-center rounded-md px-4 py-2 text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:bg-opacity-50 sm:w-auto"
              )}
              onClick={() => {
                setFilter("year");
              }}
            >
              This Year
            </button>
          </div>

          <div className={cn("grid gap-2")}>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="date"
                  variant={"outline"}
                  className={cn(
                    "w-full justify-start text-left font-normal md:w-[300px]",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date?.from ? (
                    date.to ? (
                      <>
                        {format(date.from, "LLL dd, y")} -{" "}
                        {format(date.to, "LLL dd, y")}
                      </>
                    ) : (
                      format(date.from, "LLL dd, y")
                    )
                  ) : (
                    <span>Pick a date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={date?.from}
                  selected={date}
                  onSelect={setDate}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>
          </div>
          <div>
            <Button
              disabled={loading}
              className="w-full text-center sm:w-44"
              onClick={generatePDF}
            >
              {loading ? (
                <Loader2
                  className="mr-2 h-4 w-4 animate-spin"
                  color="#803FE8"
                />
              ) : (
                <span className="mx-auto flex items-center text-center">
                  <Download size={20} className="mx-auto text-center" />
                  <span className="ml-2"> Generate</span>
                </span>
              )}
            </Button>
          </div>
        </div>
        <div className="mt-10 rounded-md bg-white p-8">
          <p className="mb-4 text-lg font-bold">Downloaded Records</p>
          {reports && <DataTable columns={columns} data={reports} />}
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

export default Report;
