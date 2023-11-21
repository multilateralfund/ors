import { AgAdmCellRenderer } from '@ors/components/manage/AgCellRenderers/AgAdmCellRenderer'
import AgBooleanCellRenderer from '@ors/components/manage/AgCellRenderers/AgBooleanCellRenderer'
import AgDateCellRenderer from '@ors/components/manage/AgCellRenderers/AgDateCellRenderer'
import AgFloatCellRenderer from '@ors/components/manage/AgCellRenderers/AgFloatCellRenderer'
import AgTextCellRenderer from '@ors/components/manage/AgCellRenderers/AgTextCellRenderer'
import AgUsageCellRenderer from '@ors/components/manage/AgCellRenderers/AgUsageCellRenderer'
import AgHeaderComponent from '@ors/components/manage/AgComponents/AgHeaderComponent'
import AgHeaderGroupComponent from '@ors/components/manage/AgComponents/AgHeaderGroupComponent'
import CellAdmDateWidget from '@ors/components/manage/AgWidgets/CellAdmDateWidget'
import CellAdmNumberWidget from '@ors/components/manage/AgWidgets/CellAdmNumberWidget '
import CellAdmTextareaWidget from '@ors/components/manage/AgWidgets/CellAdmTextareaWidget'
import CellAutocompleteWidget from '@ors/components/manage/AgWidgets/CellAutocompleteWidget'
import CellDateWidget from '@ors/components/manage/AgWidgets/CellDateWidget'
import CellNumberWidget from '@ors/components/manage/AgWidgets/CellNumberWidget'
import CellTextareaWidget from '@ors/components/manage/AgWidgets/CellTextareaWidget'
import CellUsageWidget from '@ors/components/manage/AgWidgets/CellUsageWidget'

const components: Record<string, React.FC<any>> = {
  agAdmCellRenderer: AgAdmCellRenderer,
  agAdmDateCellEditor: CellAdmDateWidget,
  agAdmNumberCellEditor: CellAdmNumberWidget,
  agAdmTextCellEditor: CellAdmTextareaWidget,
  agBooleanCellRenderer: AgBooleanCellRenderer,
  agColumnHeader: AgHeaderComponent,
  agColumnHeaderGroup: AgHeaderGroupComponent,
  agDateCellEditor: CellDateWidget,
  agDateCellRenderer: AgDateCellRenderer,
  agFloatCellRenderer: AgFloatCellRenderer,
  agNumberCellEditor: CellNumberWidget,
  agSelectCellEditor: CellAutocompleteWidget,
  agTextCellEditor: CellTextareaWidget,
  agTextCellRenderer: AgTextCellRenderer,
  agUsageCellEditor: CellUsageWidget,
  agUsageCellRenderer: AgUsageCellRenderer,
}

export default components
