import { defineAsyncComponent } from "vue";
import { fetchRemoteComponent } from "@/util/system";

const REPORT_MODULE = "jh4j-cloud-report";

export function loadReportRemote(exposeName: string) {
  return fetchRemoteComponent(
    REPORT_MODULE,
    `./${REPORT_MODULE}/${exposeName}`
  );
}

const ReportPreview = defineAsyncComponent(() =>
  loadReportRemote("reportPreview")
);

export default ReportPreview;
