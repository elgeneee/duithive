/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { type NextPage } from "next";
import { getSession, useSession } from "next-auth/react";
import AppLayout from "@/components/AppLayout";
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  CartesianGrid,
  Tooltip,
  XAxis,
  YAxis,
  Cell,
} from "recharts";
import { api } from "@/utils/api";
import filter from "lodash/filter";
import groupBy from "lodash/groupBy";
import map from "lodash/map";
import sumBy from "lodash/sumBy";
import { useState, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
// import type { inferRouterInputs, inferRouterOutputs } from "@trpc/server";
import Link from "next/link";

const colors = [
  "#9D74F3",
  "#6DC8FC",
  "#DFD7FD",
  "#6FCF97",
  "#803FE8",
  "#AB8EF7",
];

const Dashboard: NextPage = () => {
  const { data: session } = useSession();

  //area
  const [expenseAreaData, setExpenseAreaData] = useState<unknown[]>([]);
  const [expenseTotal, setExpenseTotal] = useState<number>(0);
  const [incomeAreaData, setIncomeAreaData] = useState<unknown[]>([]);
  const [incomeTotal, setIncomeTotal] = useState<number>(0);

  //bar
  const [barChartValue, setBarChartValue] = useState<string>("week");
  const [barData, setBarData] = useState<unknown[]>([]);

  //pie
  const [pieData, setPieData] = useState<unknown[]>([]);
  const [pieTotal, setPieTotal] = useState<number>(0);

  const today = new Date();
  const formattedDate = today.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "2-digit",
  });

  const { data: dashboardData } = api.dashboard.getAll.useQuery();
  const { data: userCurrency } = api.user.getUserCurrency.useQuery({
    email: session?.user?.email as string,
  });

  useEffect(() => {
    if (dashboardData) {
      barChartProcess("week");
      pieChartProcess("week");
      areaChartProcess();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dashboardData]);
  console.log(dashboardData?.expenses);
  //area chart
  const areaChartProcess = () => {
    const currDate = new Date();
    const startDate = new Date(currDate.getFullYear(), currDate.getMonth(), 1);
    const endDate = new Date(currDate.getFullYear(), currDate.getMonth() + 1);

    const expenseGroupedData = map(
      groupBy(
        filter(
          dashboardData?.expenses,
          (item) =>
            item?.transactionDate >= startDate &&
            item?.transactionDate <= endDate
        ),
        (item) => item?.transactionDate?.toDateString()
      ),
      (group, transactionDate) => ({
        transactionDate: new Date(transactionDate),
        totalAmount: sumBy(group, (item) => parseFloat(item.amount.toString())),
      })
    );

    const incomeGroupedData = map(
      groupBy(
        filter(
          dashboardData?.incomes,
          (item) =>
            item?.transactionDate >= startDate &&
            item?.transactionDate <= endDate
        ),
        (item) => item?.transactionDate?.toDateString()
      ),
      (group, transactionDate) => ({
        transactionDate: new Date(transactionDate),
        totalAmount: sumBy(group, (item) => parseFloat(item.amount.toString())),
      })
    );
    const expenseTotal = sumBy(expenseGroupedData, (item) => item.totalAmount);

    const incomeTotal = sumBy(incomeGroupedData, (item) => item.totalAmount);

    setExpenseAreaData(expenseGroupedData);
    setExpenseTotal(expenseTotal);
    setIncomeAreaData(incomeGroupedData);
    setIncomeTotal(incomeTotal);
  };

  //bar chart process
  const barChartProcess = (filterValue: string) => {
    const currDate = new Date();
    const expenseGroupedData = [];
    let startDate = new Date();
    let endDate = new Date();
    switch (filterValue) {
      case "week":
        startDate = new Date(
          currDate.getFullYear(),
          currDate.getMonth(),
          currDate.getDate() - 6
        );
        break;
      case "month":
        startDate = new Date(currDate.getFullYear(), currDate.getMonth(), 1);
        endDate = new Date(currDate.getFullYear(), currDate.getMonth() + 1, 0);
        break;
      case "year":
        startDate = new Date(
          currDate.getFullYear() - 1,
          currDate.getMonth(),
          currDate.getDate()
        );
        break;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const transactionDateKey = (item: any, filterValue: string) => {
      const transactionDate = new Date(item?.transactionDate);

      if (filterValue === "week" || filterValue === "month") {
        return transactionDate.toDateString();
      } else {
        return `${transactionDate.toLocaleString("default", {
          month: "short",
        })} ${transactionDate.getFullYear()}`;
      }
    };

    const groupedData = groupBy(
      filter(dashboardData?.expenses, (item) => {
        const transactionDate = new Date(item?.transactionDate);
        return transactionDate >= startDate && transactionDate <= endDate;
      }),
      (item) => transactionDateKey(item, filterValue)
    );

    if (filterValue === "week" || filterValue === "month") {
      for (
        let date = new Date(startDate);
        date <= endDate;
        date.setDate(date.getDate() + 1)
      ) {
        const transactionDate = date.toDateString();
        const totalAmount = groupedData[transactionDate]
          ? sumBy(groupedData[transactionDate], (item) =>
              parseFloat(item.amount.toString())
            )
          : 0;

        expenseGroupedData.push({
          transactionDate: `${date.getDate()}/${date.getMonth() + 1}`,
          totalAmount,
        });
      }
    } else {
      for (let i = 1; i <= 12; i++) {
        const transactionDate = new Date(
          startDate.getFullYear(),
          startDate.getMonth() + i,
          1
        );

        const transactionMonthYear = `${transactionDate.toLocaleString(
          "default",
          { month: "short" }
        )} ${transactionDate.getFullYear().toString()}`;

        const totalAmount = groupedData[transactionMonthYear]
          ? sumBy(groupedData[transactionMonthYear], (item) =>
              parseFloat(item.amount.toString())
            )
          : 0;

        expenseGroupedData.push({
          transactionDate: transactionMonthYear,
          totalAmount,
        });
      }
    }
    setBarData(expenseGroupedData);
  };

  //pie chart
  const pieChartProcess = (filterValue: string) => {
    let startDate = new Date();
    const endDate = new Date();
    switch (filterValue) {
      case "week":
        const day = startDate.getDay();
        const diff = startDate.getDate() - day + (day === 0 ? -6 : 1);
        startDate.setDate(diff);
        break;
      case "month":
        startDate = new Date(endDate.getFullYear(), endDate.getMonth(), 1);
        break;
      case "year":
        startDate = new Date(endDate.getFullYear(), 0, 1);
        break;
    }

    const groupedData = map(
      groupBy(
        filter(
          dashboardData?.expenses,
          (item) =>
            item?.transactionDate >= startDate &&
            item?.transactionDate <= endDate
        ),
        (item) => item?.category?.name
      ),
      //group - array of items
      //category - key name
      (group, category) => ({
        category: category,
        totalAmount: sumBy(group, (item) => parseFloat(item.amount.toString())),
      })
    );

    const pieTotal = sumBy(groupedData, (item) => item.totalAmount);

    setPieData(groupedData);
    setPieTotal(pieTotal);
  };

  return (
    <AppLayout>
      <main className="p-4">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-athens-gray-300">{formattedDate}</p>
        {/* first layer */}
        <div className="mt-10 flex space-x-3">
          <div className="flex h-36 w-1/5 flex-col justify-between overflow-hidden rounded-lg border border-athens-gray-100 bg-white p-3">
            <ResponsiveContainer width="100%" height="50%">
              <AreaChart
                data={incomeAreaData}
                margin={{ top: 10, right: 0, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6FCF97" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#6FCF97" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area
                  type="monotone"
                  dataKey="totalAmount"
                  stroke="#27AE60"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorExpense)"
                />
              </AreaChart>
            </ResponsiveContainer>
            <div>
              <p className="font-semibold text-[#A0A5AF]">Income</p>
              <p className="text-lg font-semibold">
                +{userCurrency?.symbol}{" "}
                {incomeTotal.toLocaleString(undefined, {
                  maximumFractionDigits: 2,
                  minimumFractionDigits: 2,
                })}
              </p>
            </div>
          </div>
          <div className="flex h-36 w-1/5 flex-col justify-between overflow-hidden rounded-lg border border-athens-gray-100 bg-white p-3">
            <ResponsiveContainer width="100%" height="50%">
              <AreaChart
                data={expenseAreaData}
                margin={{ top: 10, right: 0, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#EB5757" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#EB5757" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area
                  type="monotone"
                  dataKey="totalAmount"
                  stroke="#EB5757"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorIncome)"
                />
              </AreaChart>
            </ResponsiveContainer>
            <div>
              <p className="font-semibold text-[#A0A5AF]">Expense</p>
              <p className="text-lg font-semibold">
                -{userCurrency?.symbol}{" "}
                {expenseTotal.toLocaleString(undefined, {
                  maximumFractionDigits: 2,
                  minimumFractionDigits: 2,
                })}
              </p>
            </div>
          </div>
          <div className="flex h-36 w-3/5 items-center justify-center rounded-lg border border-athens-gray-100 bg-white">
            <p className="font-light italic text-[#A0A5AF]">No budget yet</p>
          </div>
        </div>

        {/* secondlayer */}
        <div className="mt-10 flex space-x-3">
          <div className="flex h-96 w-2/3 flex-col justify-between overflow-hidden rounded-lg border border-athens-gray-100 bg-white p-3">
            <div className="803FE8 flex justify-end space-x-3 font-bold">
              <button
                className={cn(
                  barChartValue == "week"
                    ? "border-b-4 border-violet-600 text-violet-600"
                    : "text-[#A0A5AF]"
                )}
                onClick={() => {
                  setBarChartValue("week");
                  barChartProcess("week");
                }}
              >
                7D
              </button>
              <button
                className={cn(
                  barChartValue == "month"
                    ? "border-b-4 border-violet-600 text-violet-600"
                    : "text-[#A0A5AF]"
                )}
                onClick={() => {
                  setBarChartValue("month");
                  barChartProcess("month");
                }}
              >
                1M
              </button>
              <button
                className={cn(
                  barChartValue == "year"
                    ? "border-b-4 border-violet-600 text-violet-600"
                    : "text-[#A0A5AF]"
                )}
                onClick={() => {
                  setBarChartValue("year");
                  barChartProcess("year");
                }}
              >
                1Y
              </button>
            </div>
            <ResponsiveContainer width="100%" height="80%">
              <BarChart data={barData}>
                <CartesianGrid
                  strokeDasharray="3"
                  stroke="#EAEEF4"
                  vertical={false}
                />
                <XAxis
                  dataKey="transactionDate"
                  stroke="#EAEEF4"
                  tickLine={false}
                  tick={{ fill: "#667991", fontWeight: 300, fontSize: 12 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#667991", fontWeight: 300, fontSize: 12 }}
                />
                <Bar
                  dataKey="totalAmount"
                  fill="#803FE8"
                  radius={100}
                  barSize={15}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex h-96 w-1/3 flex-col overflow-hidden rounded-lg border border-athens-gray-100 bg-white p-3">
            <p className="pl-4 font-satoshi text-xl font-bold">Categories</p>
            <div className="relative flex h-full w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="totalAmount"
                    nameKey="category"
                    innerRadius={80}
                    outerRadius={100}
                    fill="#82ca9d"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={colors[index]} />
                    ))}
                  </Pie>
                  <Tooltip
                    isAnimationActive={false}
                    contentStyle={{ zIndex: 9999 }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2 text-center">
                <p className="text-xl font-bold">
                  {userCurrency?.symbol}
                  {pieTotal.toFixed(2)}
                </p>
                <Select onValueChange={(value) => pieChartProcess(value)}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="This week" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="week">This Week</SelectItem>
                      <SelectItem value="month">This Month</SelectItem>
                      <SelectItem value="year">This Year</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>

        {/* third layer */}
        <div className="mt-10 flex w-2/3 flex-col rounded-lg border border-athens-gray-100 bg-white p-3">
          <div className="flex items-center justify-between">
            <p className="font-satoshi text-xl font-bold">Latest Spendings</p>
            <Link href="/expense">
              <p className="text-sm text-[#A0A5AF] hover:underline">View All</p>
            </Link>
          </div>
          <hr className="my-2" />
          <div className="min-h-[10rem] space-y-4">
            {dashboardData?.expenses?.length ? (
              dashboardData.expenses.slice(0, 5).map((expense) => (
                <div
                  key={expense.id}
                  className="flex items-center justify-between"
                >
                  <div>
                    <p className="font-semibold">{expense.description}</p>
                    <p className="text-xs text-[#A0A5AF]">
                      {expense.transactionDate.toLocaleDateString("en-US", {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  <p className="text-sm font-semibold ">
                    -{userCurrency?.symbol}
                    {parseFloat(expense.amount.toString()).toFixed(2)}
                  </p>
                </div>
              ))
            ) : (
              <p className="translate-y-16 text-center italic text-[#A0A5AF]">
                No expenses yet
              </p>
            )}
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

export default Dashboard;

// const AuthShowcase: React.FC = () => {
//   const { data: sessionData } = useSession();

//   const { data: secretMessage } = api.example.getSecretMessage.useQuery(
//     undefined, // no input
//     { enabled: sessionData?.user !== undefined }
//   );

//   return (
//     <div className="flex flex-col items-center justify-center gap-4">
//       <p className="text-center text-2xl text-white">
//         {sessionData && <span>Logged in as {sessionData.user?.name}</span>}
//         {secretMessage && <span> - {secretMessage}</span>}
//       </p>
//       <button
//         className="rounded-full bg-white/10 px-10 py-3 font-semibold text-white no-underline transition hover:bg-white/20"
//         onClick={sessionData ? () => void signOut() : () => void signIn()}
//       >
//         {sessionData ? "Sign out" : "Sign in"}
//       </button>
//     </div>
//   );
// };
