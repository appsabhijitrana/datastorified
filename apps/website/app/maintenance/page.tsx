import { MaintenancePage } from "../../components/status/MaintenancePage";
import { StatusService } from "../../lib/status/service";

export default function Page() {
  return <MaintenancePage maintenance={StatusService.getMaintenance()} />;
}
