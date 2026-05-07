import React, { useState, useEffect, useRef, Component } from 'react';
import CanvasJSReact from '@canvasjs/react-charts';
import { Button } from 'primereact/button';
import { DataTable } from 'primereact/datatable';
import DashboardMenu from './DashboardMenu';
import { Column } from 'primereact/column';
import { Dialog } from 'primereact/dialog';
import { Menu } from 'primereact/menu';
import { DashboardService } from '../../service/DashboardService';
import '../../assets/styles.css';
import { InputText } from 'primereact/inputtext';
import { Toast } from 'primereact/toast';
import { OrdersImportService } from '../../service/outbound/OrdersImportService';
import { ProgressSpinner } from 'primereact/progressspinner';
var CanvasJS = CanvasJSReact.CanvasJS;
var CanvasJSChart = CanvasJSReact.CanvasJSChart;
import { useAuth } from '../../store/useAuth';


const OrdersDashboard = (props) => {
const { hasActionAccess } = useAuth();
const PAGE_KEY = "order_dashboard";
const canUpdateUpper = hasActionAccess(PAGE_KEY, "update_task_upper");
const canUpdateLower = hasActionAccess(PAGE_KEY, "update_task_lower");
const menuUpper = useRef(null);
const menuLower = useRef(null);
  const menuLeft = useRef(null);
  const [loading, setLoading] = useState(true);
  const [totalRecords, setTotalRecords] = useState(false);
  const [btnDisabled, setbtnDisabled] = useState(true);
  const [displayConfirmation14, setDisplayConfirmation14] = useState(false);
  const [displayConfirmation15, setDisplayConfirmation15] = useState(false);
  const [selectedOrderShort, setSelectedOrderShort] = useState(null);
  const [Itemissuescount, setItemissuescount] = useState(0);
  const [Qtyfreecount, setQtyfreecount] = useState(0);
  const [orderStatusChartData, setOrderStatusChartData] = useState([]);
  const [actualItemCountChartData, setActualItemCountChartData] = useState([]);
  const [innerItemCountChartData, setInnerItemCountChartData] = useState([]);
  const [itemInformationChartData, setItemInformationChartData] = useState([]);
  const [displaySyncConfirmation, setDisplaySyncConfirmation] = useState(false);
  const [taskManagment, setTaskManagment] = useState([]);
  const [UserDetail, setUserDetail] = useState([]);
  const [UserDetailModel, setUserDetailModel] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(true);
  const [code, setCode] = useState([]);
  const [modelMsg, setModelMsg] = useState(null);
  const [displayTaskUpdateConfirmation, setDisplayTaskUpdateConfirmation] = useState(false);



  const toast = useRef();
  const filters = [
    { name: 'ID', code: 'pick_list_id' },
    { name: 'Code', code: 'prd_PrimaryCode' },
    { name: 'Date', code: 'create_datetime' },
    { name: 'Status', code: 'ors_MessageCode' },
    { name: 'Issue', code: 'Item_issues' },
    { name: 'Qty Free', code: 'Qty_Free' }
  ];
  const daysoptions = [
    { name: 'Last 2 Days', code: '2' },
    { name: 'Last 3 Days', code: '3' },
    { name: 'Last 4 Days', code: '4' },
    { name: 'Last 5 Days', code: '5' },
    { name: 'Last 6 Days', code: '6' },
    { name: 'Last 1 Weeks', code: '7' },
    { name: 'Last 2 Weeks', code: '14' },
    { name: 'Last 3 Weeks', code: '21' },
    { name: 'Last 1 Month', code: '30' }
  ];
  const [selectedFilters, setSelectedFilters] = useState(filters[0]['code']);
  const [selectedDays, setSelectedDays] = useState(daysoptions[0]['code']);
  const [filterText, setFilterText] = useState(null);
  const [selectedTasks, setSelectedTasks] = useState(null);
  const getOrderShortGridData = (data = []) => {
    setLoading(true);
    DashboardService.getOrderShortData(data)
      .then(data => {
        if (!data || !data.data || data.data.length === 0) {
          setOrderShort([]);
          setOrderStatusChartData([]);
          setActualItemCountChartData([]);
          setInnerItemCountChartData([]);
          setItemInformationChartData([]);
        } else {
          setOrderShort(data?.data.grid_data);
          setOrderStatusChartData(data?.data.order_status_data || []);
          setActualItemCountChartData(data?.data.item_ActualQtyCount || []);
          setInnerItemCountChartData(data?.data.item_InnerQtyCount || []);
          setItemInformationChartData(data?.data.item_information || []);

        }
      }).finally(() => setLoading(false));

  }

  const getTaskManagment = (params = {}) => {
    setLoading(true);
    DashboardService.getTaskManagment(params)
      .then(data => {
        setTaskManagment(data?.data);
      })
      .catch(error => {
        toast.current.show({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to fetch another data'
        });
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    refreshOrderShort();
    refreshTaskManagement(); // Lo
  }, []);

  const [orderShort, setOrderShort] = useState([]);
  const handleTaskUpdate = () => {
    setLoading(true);
    setbtnDisabled(true);

    const data = {
      task: selectedTasks,
    };

    DashboardService.updateTaskStatus(data).then((response) => {
      if (response.error === 0) {
        toast.current.show({ severity: 'success', summary: 'Success', detail: response.message });
        setSelectedTasks(null); // clear selection
        getTaskManagment();
      } else {
        toast.current.show({ severity: 'error', summary: 'Error', detail: response.message });
      }

      setDisplayTaskUpdateConfirmation(false);
      setLoading(false);
      setbtnDisabled(false);
    });
  };
  const refreshOrderShort = () => {
    const data = {
      'filter_text': filterText,
      'filter_by': selectedFilters,
      'days': selectedDays
    }
    getOrderShortGridData(data); // Only refreshes orderShort data
  }
  const confirmationDialogFooter14 = (
    <>
      <Button type="button" label="No" icon="pi pi-times" onClick={() => setDisplayConfirmation14(false)} className="p-button-text" />
      <Button type="button" label="Yes" icon="pi pi-check" onClick={() => appendReExecuteOrder()} className="p-button-text" autoFocus />
    </>
  );
  const appendReExecuteOrder = () => {

    setLoading(true);
    setbtnDisabled(true);

    const data = {
      order: selectedOrderShort,
    }

    OrdersImportService.appendReExecuteOrder((data)).then((data) => {

      if (data.error == 0) {
        toast.current.show({ severity: 'success', summary: 'Success', detail: data.message });
        setSelectedOrderShort(null);

      }
      else {

        toast.current.show({ severity: 'error', summary: 'Error', detail: data.message });
      }
      setDisplayConfirmation14(false);
      setLoading(false);
      setbtnDisabled(false);

    });
  };
  const confirmationSyncDialogFooter = (
    <>
      <Button type="button" label="No" icon="pi pi-times" onClick={() => setDisplaySyncConfirmation(false)} className="p-button-text" />
      <Button type="button" label="Yes" icon="pi pi-check" onClick={() => reValidateItem()} className="p-button-text" autoFocus />
    </>
  );
  const taskUpdateConfirmationFooter = (
    <>
      <Button type="button" label="No" icon="pi pi-times" onClick={() => setDisplayTaskUpdateConfirmation(false)} className="p-button-text" />
      <Button type="button" label="Yes" icon="pi pi-check" onClick={handleTaskUpdate} className="p-button-text" autoFocus />
    </>
  );
  const reValidateItem = () => {

    setLoading(true);
    const data = { order: selectedOrderShort }
    DashboardService.reValidateItem(data).then((data) => {

      if (data.error == 0) {
        setDisplaySyncConfirmation(false);
        setLoading(false);
        setSelectedOrderShort(null);
        toast.current.show({ severity: 'success', summary: 'Operation successful', detail: data.message });

        getOrderShortGridData();

      } else {
        setLoading(false);
        setSelectedOrderShort(null);
        toast.current.show({ severity: 'error', summary: 'Error while Deletion', detail: data.message });
      }
    });

  }
  const actionItems = [

    {
      label: 'Append & Re-execute Order',
      icon: 'pi pi-sync',
      command: () => {

        if (selectedOrderShort != null) {
          setbtnDisabled(true)
          setDisplayConfirmation14(true)
        } else {
          toast.current.show({ severity: 'error', summary: 'Error', detail: 'Select order' });
        }
      }

    },
    {
      label: 'Re-Validate Item',
      icon: 'pi pi-check',
      command: () => {

        if (selectedOrderShort != null) {
          setbtnDisabled(true)
          setDisplaySyncConfirmation(true)
        } else {
          toast.current.show({ severity: 'error', summary: 'Error', detail: 'Select order' });
        }
      }
    }

  ];

  const getOrderDetail = (PrimaryCode) => {
    setUserDetail(null);
    setUserDetailModel(true);
    setCode(PrimaryCode);
    setLoadingDetail(true);

    const data = { primary_code: PrimaryCode };

    DashboardService.getOrderDetail(data)
      .then((res) => {
        if (res?.error === 1) {
          setUserDetailModel(false);
          setLoadingDetail(false);
          toast.current.show({
            severity: 'error',
            summary: 'Error',
            detail: res.message || 'Something went wrong.',
          });

        }
        else {
          setUserDetail(res.data);
          setLoadingDetail(false);
        }
      })
      .catch((err) => {
        console.error(err);
        toast.current.show({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to fetch order details.',
        });

        // Close popup and stop loading
        setUserDetailModel(false);
        setLoadingDetail(false);
      });
  };
  // const taskActionItems = [
  //   {
  //     label: 'Update Task',
  //     icon: 'pi pi-sync',
  //     command: () => {
  //       if (selectedTasks != null) {
  //         setbtnDisabled(true);
  //         setDisplayTaskUpdateConfirmation(true);
  //       } else {
  //         toast.current.show({ severity: 'error', summary: 'Error', detail: 'Select a task' });
  //       }
  //     },
  //   },
  // ];
  const upperActionItems = [
  canUpdateUpper && {
    label: 'Update Task',
    icon: 'pi pi-sync',
    command: () => {
      if (selectedOrderShort != null) {
        setbtnDisabled(true);
        setDisplayTaskUpdateConfirmation(true);
      } else {
        toast.current.show({
          severity: 'error',
          summary: 'Error',
          detail: 'Select order'
        });
      }
    }
  }

].filter(Boolean);
  const lowerActionItems = [
  canUpdateLower && {
    label: 'Update Task',
    icon: 'pi pi-sync',
    command: () => {
      if (selectedTasks != null) {
        setbtnDisabled(true);
        setDisplayTaskUpdateConfirmation(true);
      } else {
        toast.current.show({ severity: 'error', summary: 'Error', detail: 'Select a task' });
      }
    }
  }
].filter(Boolean);

  const orderStatusCounts = {};
  const itemActualQtyCount = {};
  const itemInnerQtyCount = {};
  let Item_issues_count = 0;
  let qty_free_count = 0;

  const rowClassName = (rowData) => {
    return rowData.qty_Free === 'no Stock' ? 'row-success' : 'row-red';
  };


  const refreshTaskManagement = () => {
    getTaskManagment(); // Only refreshes task data
  };
  const header = (
    <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
      <span className="block mt-2 md:mt-0 p-input-icon-left">
        <Menu model={upperActionItems} popup ref={menuUpper} id="popup_menu_upper" />

{upperActionItems.length > 0 && (
  <Button
    label="Actions"
    icon="pi pi-align-left"
    className="p-2 text-xs"
    onClick={(event) => menuUpper.current.toggle(event)}
  />
)}
      </span>
      <Toast ref={toast} />
      <Button
        label="Refresh"
        loading={loading}
        onClick={() => {
          refreshOrderShort();
          refreshTaskManagement();
        }}
        severity="success"
        icon="pi pi-refresh"
        className="ml-4"
        size="small"
      />
      <span className="block mt-2 md:mt-0 p-input-icon-left ">

        <InputText type="text" onChange={(e) => {
          setFilterText(e.target.value); filterGrid(e.target.value, selectedDays);
        }} className="p-inputtext-sm cust-small-input w-full md:w-30rem" placeholder="Search..." />

        <select className="w-full md:w-10rem select-box-min" onChange={(event) => {
          setSelectedFilters(event.target.value);
        }}>

          {filters.map(option => (
            <option key={option.code} value={option.code}  >
              {option.name}
            </option>
          ))}
        </select>

        <select className=" select-box-min" onChange={(event) => {
          setSelectedDays(event.target.value);
          filterGrid(filterText, event.target.value);
        }}>

          {daysoptions.map(option => (
            <option key={option.code} value={option.code}  >
              {option.name}
            </option>
          ))}
        </select>





      </span>
    </div>

  );
  const taskManagmentheader = (
  <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
    <span className="block mt-2 md:mt-0 p-input-icon-left">

      <Menu model={lowerActionItems} popup ref={menuLower} id="popup_menu_lower" />

      {lowerActionItems.length > 0 && (
        <Button
          label="Actions"
          icon="pi pi-align-left"
          className="p-2 text-xs"
          onClick={(event) => menuLower.current.toggle(event)}
        />
      )}

    </span>

    <Toast ref={toast} />
  </div>
);
  const filterGrid = (text, days) => {


    const data = {
      'filter_text': text,
      'filter_by': selectedFilters,
      'days': days
    }

    getOrderShortGridData(data)




  }
  const orderByItems = {

  };
  const orderStatusChart = {


  }
  const itemInformation = {

  }
  const onSelectionChange = (event) => {
    const value = event.value;
    setSelectedTasks(value);

    setSelectedOrderShort(value);

  };
  const cancleModel = (reload = false) => {
    setUserDetail(null)
    setCode('')
    setUserDetailModel(false);

  }

  const formatDate = (datetime) => {
    if (!datetime) return "";
    const date = new Date(datetime);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const seconds = String(date.getSeconds()).padStart(2, "0");
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}:000`;
  };

  return (
    <>
      <Dialog header={`Item Code: ${code}`} receivingModel visible={UserDetailModel} style={{ width: '50vw' }}
        position='top' onHide={() => { if (!UserDetailModel) return; cancleModel(); }}
      >

        <p className="m-0">
          <div className="flex flex-column px-8 py-5 gap-4" style={{ borderRadius: '12px', backgroundColor: '#f9f9f9' }}>
            {(modelMsg != '') ? (<p className="p-error font-semibold">{modelMsg}</p>) : ''}
          </div>
        </p>
        {(!UserDetail) ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <ProgressSpinner />
          </div>
        ) : (
          <div className="card p-0 " >
            <DataTable removableSort
              value={UserDetail}
              className="datatable-responsive"
              emptyMessage="No records found."
              showGridlines
              sort
              tableStyle={{ minWidth: '40rem' }}
              size="small"
              stripedRows
              loading={loadingDetail} scrollable scrollHeight="350px"
            >
              <Column header="Location Code" field="loc_Code" body={(data) => data.loc_Code} />
              <Column header="Available Quantity" field="SPTQuantityFree" body={(data) => data.sptQuantityFree} />
              <Column header="Quantity" field="SPTQuantity" body={(data) => data.sptQuantity} />
              <Column header="Lot Number" field="LotNum" body={(data) => data.lotNum} />
              <Column header="Reserve Reason" field="ReserveReasonDescr" body={(data) => data.reserveReasonDescr || ''} />
              <Column header="Expiration Date" field="exp_date" body={(data) => data.exp_date || ''} />

            </DataTable>
          </div>
        )}

      </Dialog>

      <Dialog header="Confirmation" visible={displayConfirmation14} onHide={() => setDisplayConfirmation14(false)} style={{ width: '350px' }} modal footer={confirmationDialogFooter14}>
        <div className="flex align-items-center justify-content-center">
          <i className="pi pi-exclamation-triangle mr-3" style={{ fontSize: '2rem' }} />
          <span>Are you sure you want to proceed?</span>
        </div>
      </Dialog>
      <Dialog header="Confirmation" visible={displaySyncConfirmation} onHide={() => setDisplaySyncConfirmation(false)} style={{ width: '350px' }} modal footer={confirmationSyncDialogFooter}>
        <div className="flex align-items-center justify-content-center">
          <i className="pi pi-exclamation-triangle mr-3" style={{ fontSize: '2rem' }} />
          <span>Are you sure you want to delete?</span>
        </div>
      </Dialog>
      <Dialog
        visible={displayTaskUpdateConfirmation}
        onHide={() => setDisplayTaskUpdateConfirmation(false)}
        header="Confirm Task Update"
        modal
        footer={taskUpdateConfirmationFooter}
      >
        <p>Are you sure you want to update this task?</p>
      </Dialog>
      <div className="card mt-4">
        <h3>Order Dashboard</h3>
        <div className="card p-0 " style={{ height: '100%', minHeight: '250px' }}>
          <DataTable removableSort value={orderShort}
            className="datatable-responsive"
            header={header}
            selection={selectedOrderShort}
            onSelectionChange={onSelectionChange}
            emptyMessage="No records found."
            showGridlines
            sort="true"
            tableStyle={{ minWidth: '100%', width: 'auto' }}
            size="small"
            stripedRows
            loading={loading} scrollable
            scrollHeight="600px"
            rowClassName={rowClassName}
          >
            <Column selectionMode="single" headerStyle={{ width: '3rem' }} />
            <Column header="ID" field="pick_list_id" body={(data) => data.pick_list_id} />
            <Column header="Code" field="prd_PrimaryCode" body={(data) => data.prd_PrimaryCode} />
            <Column header="QTY" field="qty" body={(data) => data.qty ?? 0} />
            <Column header="Outer QTY" field="outer_QTY" headerStyle={{ width: '8%', minWidth: '6rem' }} body={(data) => data.outer_Qty ?? 0} />
            <Column header="Inner QTY" field='inner_QTY' headerStyle={{ width: '8%', minWidth: '6rem' }} body={(data) => data.inner_Qty ?? 0} />
            <Column header="Date" field='create_datetime' headerStyle={{ width: '20%', minWidth: '6rem' }} body={(rowData) => formatDate(rowData.create_datetime)} />
            <Column header="Status" field='ors_MessageCode' body={(data) => data.pst_MessageCode ?? '--'} />
            <Column header="Issue" field='Item_issues' body={(data) => data.Item_issues ?? '--'} />
            <Column header="QTY Free" field='Qty_Free' body={(data) => data.qty_Free ?? '--'} />
            <Column
              header="View Detail"
              field="outer_QTY"
              headerStyle={{ width: '8%', minWidth: '6rem' }}
              body={(data) =>
                data.Qty_Free !== 'no Stock' ? (
                  <Button
                    label="View"
                    severity="secondary"
                    size="small"
                    outlined
                    onClick={() => getOrderDetail(data.prd_PrimaryCode)}
                  />
                ) : null
              }
            />
          </DataTable>
        </div>
        <div className="card p-0" style={{ height: '100%', minHeight: '250px', marginTop: '1rem' }}>
          <DataTable
            value={taskManagment}
            lazy
            filterDisplay="row"
            dataKey="tsk_ID"
            showGridlines
            size={'small'}
            className="datatable-responsive"
            rowsPerPageOptions={[10, 25, 50, 100]}
            loading={loading}
            tableStyle={{ minWidth: '100%', width: 'auto' }}
            emptyMessage="No records found."
            onSelectionChange={onSelectionChange} // Ensure this is properly updating your selected row(s)
            selection={selectedTasks} // Add selectedTasks state to bind with the DataTable selection
            header={taskManagmentheader}
            scrollable
            scrollHeight="600px"
            removableSort
          >
            <Column selectionMode="single" headerStyle={{ width: '3rem' }} />
            <Column field="tsk_Code" header="Task Code" body={(data) => data.tsk_Code} />
            <Column field="trt_MessageCode" header="Transaction Type" body={(data) => data.trt_MessageCode} />
            <Column field="prd_PrimaryCode" header="Primary Code" body={(data) => data.prd_PrimaryCode} />
            <Column field="username" header="User Name" body={(data) => data.username} />
            <Column field="ord_Code" header="Order Code" body={(data) => data.ord_Code} />
            <Column field="pst_MessageCode" header="Status" body={(data) => data.pst_MessageCode} />
            <Column field="CreateDate" header="Create Date" body={(data) => data.CreateDate} />
            <Column field="tsk_ActualTime" header="Execution Date" body={(data) => data.tsk_ActualTime} />
          </DataTable>
        </div>
      </div>
    </>
  );
}

const comparisonFn = function (prevProps, nextProps) {
  return (prevProps.location.pathname === nextProps.location.pathname) && (prevProps.colorMode === nextProps.colorMode);
};

export default React.memo(OrdersDashboard, comparisonFn);
