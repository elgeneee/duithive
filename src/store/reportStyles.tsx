import { StyleSheet } from "@react-pdf/renderer";

export const reportStyles = StyleSheet.create({
  page: {
    flexDirection: "column",
    padding: 30,
  },
  section: {
    flexDirection: "column",
    width: "40%",
  },
  logo: {
    height: "30px",
    objectFit: "contain",
    alignSelf: "flex-start",
  },
  chart: {
    justifyContent: "center",
    textAlign: "center",
    marginHorizontal: "auto",
    alignItems: "center",
  },
  chartLabels: {
    flexDirection: "row",
    marginVertical: 3,
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#eceef2",
    borderBottom: 1,
    borderBottomColor: "#8595ab",
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  dateView: {
    justifyContent: "flex-start",
    textAlign: "center",
    borderWidth: "1px",
    alignItems: "center",
    padding: 4,
    fontWeight: "bold",
    marginTop: "10px",
  },
  dateText: {
    fontSize: "10px",
    fontWeight: "bold",
    justifyContent: "center",
    textAlign: "center",
    alignItems: "center",
    marginHorizontal: "auto",
  },
  dataRow: {
    flexDirection: "row",
    borderBottom: 1,
    borderBottomColor: "#b0bac9",
    paddingHorizontal: 4,
  },
  cell: { flex: 1, padding: 4 },
  text: {
    fontSize: "10px",
  },
  totalCell: {
    flex: 1,
    paddingVertical: 4,
    marginHorizontal: 0,
    borderBottom: 1.5,
    borderBottomColor: "#b0bac9",
  },
  totalText: {
    justifyContent: "flex-end",
    fontSize: "10px",
    textAlign: "right",
    paddingRight: 6,
    paddingBottom: 4,
    borderBottom: 1.5,
    borderBottomColor: "#b0bac9",
  },
});
