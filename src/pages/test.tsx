import React from "react";
import ReactPDF, {
  pdf,
  Page,
  Text,
  View,
  Document,
  Image,
} from "@react-pdf/renderer";
import { reportStyles as styles } from "@/store/reportStyles";

const colors: string[] = [
  "#9D74F3",
  "#6DC8FC",
  "#DFD7FD",
  "#6FCF97",
  "#803FE8",
  "#AB8EF7",
];

type TemplateData = {
  companyName: string;
  companyPhone: string;
  companyEmail: string;
  receiptNumber: string;
  datePaid: string;
  paymentMethod: string;
  amount: string;
};

interface PDFProps {
  data: TemplateData;
}

// const PDF = ({ data }: PDFProps) => {
//   return (
//     <Document>
//       <Page size="A4" style={styles.page}>
//         <View style={styles.header}>
//           <View style={styles.section}>
//             {/* eslint-disable-next-line jsx-a11y/alt-text */}
//             <Image
//               src="https://res.cloudinary.com/dlidl2li4/image/upload/v1686925035/DuitHive/Group_3_paqhen.png"
//               style={styles.logo}
//               cache={false}
//             />
//             <View style={styles.dateView}>
//               <Text style={styles.dateText}>
//                 {date?.from?.toLocaleDateString()} -{" "}
//                 {date?.to?.toLocaleDateString()}
//               </Text>
//             </View>
//             <View style={{ marginTop: 20 }}>
//               {groupedData.map((item, index) => (
//                 <View key={index} style={styles.chartLabels}>
//                   <View
//                     style={{
//                       width: 15,
//                       height: 15,
//                       // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
//                       backgroundColor: `${colors[index]}`,
//                     }}
//                   />
//                   <Text
//                     style={[
//                       styles.text,
//                       {
//                         marginLeft: 5,
//                       },
//                     ]}
//                   >
//                     {item.category}
//                   </Text>
//                 </View>
//               ))}
//             </View>
//           </View>
//           <View style={styles.chart}>
//             <ReactPDFChart>
//               <PieChart width={730} height={250} id="piechart">
//                 <Pie
//                   isAnimationActive={false}
//                   data={groupedData}
//                   dataKey="totalAmount"
//                   nameKey="category"
//                   cx="50%"
//                   cy="50%"
//                   innerRadius={60}
//                   outerRadius={80}
//                   fill="#82ca9d"
//                   // label
//                 >
//                   {groupedData.map((entry, index) => (
//                     <Cell key={`cell-${index}`} fill={colors[index]} />
//                   ))}
//                 </Pie>
//               </PieChart>
//             </ReactPDFChart>
//           </View>
//         </View>
//         {/* Header row */}
//         {expenses && expenses?.length > 0 && (
//           <View style={styles.tableHeader}>
//             <View style={styles.cell}>
//               <Text
//                 style={[
//                   styles.text,
//                   {
//                     fontWeight: "extrabold",
//                   },
//                 ]}
//               >
//                 Name
//               </Text>
//             </View>
//             <View style={styles.cell}>
//               <Text style={styles.text}>Date</Text>
//             </View>
//             <View style={styles.cell}>
//               <Text style={styles.text}>Category</Text>
//             </View>
//             <View
//               style={[
//                 styles.cell,
//                 {
//                   justifyContent: "flex-end",
//                 },
//               ]}
//             >
//               <Text
//                 style={[
//                   styles.text,
//                   {
//                     textAlign: "right",
//                   },
//                 ]}
//               >
//                 Amount
//               </Text>
//             </View>
//           </View>
//         )}
//         {expenses?.map((item, index) => (
//           <View key={index} style={styles.dataRow}>
//             <View style={styles.cell}>
//               <Text style={styles.text}>{item.description}</Text>
//             </View>
//             <View style={styles.cell}>
//               <Text style={styles.text}>
//                 {item.transactionDate.toLocaleDateString()}
//               </Text>
//             </View>
//             <View style={styles.cell}>
//               <Text style={styles.text}>{item.category?.name}</Text>
//             </View>
//             <View style={styles.cell}>
//               <Text
//                 style={[
//                   styles.text,
//                   {
//                     textAlign: "right",
//                   },
//                 ]}
//               >
//                 {parseFloat(item.amount.toString()).toFixed(2)}
//               </Text>
//             </View>
//           </View>
//         ))}
//         {expenses && expenses.length > 0 && (
//           <View style={{ flexDirection: "row" }}>
//             <View style={styles.cell}></View>
//             <View style={styles.cell}></View>
//             <View style={styles.cell}></View>
//             <View style={styles.totalCell}>
//               <Text style={styles.totalText}>
//                 Total: {userCurrency?.symbol}
//                 {sumBy(expenses, (item) =>
//                   parseFloat(item.amount.toString())
//                 ).toFixed(2)}
//               </Text>
//             </View>
//           </View>
//         )}
//       </Page>
//     </Document>
//   );
// };

// export default async (data: TemplateData) => {
//   return await ReactPDF.renderToStream(<PDF {...{ data }} />);
// };
