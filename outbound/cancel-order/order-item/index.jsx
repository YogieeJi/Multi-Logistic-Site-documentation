import { Badge } from 'primereact/badge';
import React, { useState, useEffect, useRef } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from 'primereact/button';
import { Helmet } from 'react-helmet';
import { Toast } from 'primereact/toast';
import { Menu } from 'primereact/menu';
import { OrdersImportService } from '../../../../service/outbound/OrdersImportService';
import { Sidebar } from 'primereact/sidebar';
import { TabView, TabPanel } from 'primereact/tabview';
import { Timeline } from 'primereact/timeline';
import { Dialog } from 'primereact/dialog';
import { GeneralService } from '../../../../service/inbound/GeneralService';
import CancelOrderMenu from '../../ordersImport/CancelOrderMenu';
import { useLazySort } from '../../../../components/useLazySort';
import { Tooltip } from 'primereact/tooltip';
import { useAuth } from '../../../../store/useAuth';


export default function Users() {
    const [loading, setLoading] = useState(false);
    const [totalRecords, setTotalRecords] = useState(0);
    const [users, setUsers] = useState(null);
    const [selectAll, setSelectAll] = useState(false);
    const [selectedUsers, setSelectedUsers] = useState(null);
    const [displayConfirmation9, setDisplayConfirmation9] = useState(false);
    const [visible, setVisible] = useState(false);
    const [dialogText, setDialogText] = useState('');
    const [visibleRight, setVisibleRight] = useState(false);
    const [logs, setLogs] = useState(null);
    const [errorLogs, setErrorLogs] = useState(null);
    const [btnDisabled, setbtnDisabled] = useState(true);
     const { hasActionAccess, hasPageAccess } = useAuth();
        const PAGE_KEY = "Cancel_order_details";
    const toast = useRef();
    const navigate = useNavigate();
    const [lazyState, setlazyState] = useState({
        first: 0,
        rows: 25,
        page: 1,
        sortField: "",
        sortOrder: "",
        filters: {

            osi_QuantitySU: { value: null, matchMode: 'contains' },
            ori_ItemUnit: { value: null, matchMode: 'contains' },
            osi_Quantity: { value: null, matchMode: 'contains' },
            product: { value: null, matchMode: 'contains' },
        }
    });
    const { onSort } = useLazySort(setlazyState);
    const params = useParams();
    let networkTimeout = null;

    useEffect(() => {
        loadLazyData();
    }, [lazyState]);

    const loadLazyData = () => {
        setLoading(true);

        if (networkTimeout) {
            clearTimeout(networkTimeout);
        }

        networkTimeout = setTimeout(() => {
            const data = lazyState;
            data.code = params.pick_list_id;
            OrdersImportService.getOrderItem((data)).then((data) => {
                setTotalRecords(data.totalRecords);
                setUsers(data.data);

                setLoading(false);
            });
        }, Math.random() * 100 + 250);

    };
   const logTopics = useState({
        moduleId: 2,
        subModuleId: 12,
        subjectId: params.id
    });

    useEffect(() => {
        loadLogsData(); 
    }, []);
    const onPage = (event) => {
        setlazyState(event);
    };

    const onFilter = (event) => {
        event['first'] = 0;
        setlazyState(event);
    };

    const onSelectionChange = (event) => {
        const value = event.value;

        setSelectedUsers(value);
        setSelectAll(value.length === totalRecords);
    };
    const loadLogsData = async () => {
        try {
            setLoading(true);

            const response = await GeneralService.getLogs(logTopics[0]);
            const logsData = response.data || [];

            setLogs(logsData);

            const errorLogs = logsData.filter(log => log.event === 'error');
            setErrorLogs(errorLogs);

        } catch (error) {
            console.error("Failed to load logs:", error);
        } finally {
            setLoading(false);
        }
    };
    const onSelectAllChange = (event) => {
        const selectAll = event.checked;

        if (selectAll) {
            setSelectAll(true);
            setSelectedUsers(users);
        } else {
            setSelectAll(false);
            setSelectedUsers([]);
        }
    };
const customizedContent = (item) => {
        // let causerName =  item.user_name ? item.user_name : 'System';
        let causerName =  item.user_name ? item.user_name : 'System';
        let date = new Date(item.created_at);
        let month = (date.getMonth() < 10) ? '0' + (date.getMonth() + 1) : date.getMonth() + 1;
        let day = (date.getDate() < 10) ? '0' + (date.getDate()) : date.getDate();
        let hours = (date.getHours() < 10) ? '0' + (date.getHours()) : date.getHours();
        let minutes = (date.getMinutes() < 10) ? '0' + (date.getMinutes()) : date.getMinutes();
        let seconds = (date.getSeconds() < 10) ? '0' + (date.getSeconds()) : date.getSeconds();
        return (
            <div className='timeline_content'>
                <div className='main_line'>


                </div>
                <div className='secondary_line'>
                    <p style={{ fontWeight: 'bold' }}>{date.getFullYear() + '-' + month + '-' + day + ' ' + hours + ':' + minutes + ':' + seconds} </p>
                    <Button label={item.event.toUpperCase()} className={item.event == 'success' ? 'status_btn  btn_success' : (item.event == 'error') ? 'status_btn  btn_danger' : 'status_btn  btn_info'}></Button>
                </div>
                <div className='secondary_line'>
                    <p>{item.description}</p>
                    <a href='' onClick={(e) => readMorePopup(e, item.properties, item.event)}>read more</a>
                </div>
                <div className='secondary_line mb-3'>
                    <p>By <span style={{ fontWeight: 'bold' }}>{causerName}</span></p>
                </div>

            </div>
        );
    };

    const readMorePopup = (e, item, event) => {
        e.preventDefault();
        setVisible(true);

        let text = '';

        // Ensure properties is parsed if it's a string
        let parsedProperties = {};
        try {
            parsedProperties = typeof item === "string" ? JSON.parse(item) : item;
        } catch (error) {
            console.error("Error parsing properties:", error);
            parsedProperties = {}; // Fallback in case of error
        }

        // Extract data/request/response if available
        const data = parsedProperties?.data || null;
        const request = parsedProperties?.request || null;
        const response = parsedProperties?.response || null;

        if (data) {
            // Display shipment details
            text += '<h5>Below data created</h5>';
            Object.keys(data).forEach((key) => {
                text += `${key} = ${data[key]}<br>`;
            });
        } else if (event === 'sync') {
            // Display sync request and response
            text += '<h5>Request</h5>';
            text += `<meta http-equiv="Content-Type" content="text/html; charset=utf-8">${request || 'No request data'}</meta>`;
            text += '<br><h5>Response</h5>';
            text += JSON.stringify(response || 'No response data', null, 2);
        } else if (event === 'error') {
            // Display error message
            text += '<h5>Exception</h5>';
            text += item?.error || 'No error data';
        }

        setDialogText(text);
    };
    const nameBodyTemplate = (rowData) => {
        let badgeProps = { value: rowData.shipItemStatus, severity: "secondary" };

        if (rowData.shipItemStatus === '0 - Pending') {
            badgeProps = { value: "0 - Pending", severity: "warning" };
        } else if (rowData.shipItemStatus === '40 - Picked') {
            badgeProps = { value: "40 - Picked", severity: "info" };
        } else if (rowData.shipItemStatus === '90 - Completed') {
            badgeProps = { value: "90 - Completed", severity: "success" };
        } else if (rowData.shipItemStatus === '99 - Cancelled') {
            badgeProps = { value: "99 - Cancelled", severity: "danger" };
        } else if (rowData.shipItemStatus === '30 - For picking') {
            badgeProps = { value: "30 - For picking", severity: "primary" };
        }

        return <Badge {...badgeProps} />;
    };

    // hide Cancel Item button 
    const showCancelItem = import.meta.env.VITE_SHOW_CANCEL_ORDERS === "true";

    const actionItems = [
    hasActionAccess(PAGE_KEY, "cancel_item") && {
            label: 'Cancel Item',
            icon: 'fa fa-times',
            command: () => {
                if (selectedUsers != null && selectedUsers.length >= 1) {
                       setbtnDisabled(false)
                       setDisplayConfirmation9(true)
                    
                    
                   
                } else {
                    toast.current.show({ severity: 'error', summary: 'Error', detail: 'Please select 1 order item' });
                }
            }
        },
    ].filter(Boolean)

    // const actionItems = [
    //     {
    //         label: 'Cancel Item',
    //         icon: 'fa fa-times',
    //         template: (item, options) => {
    //             return (
    //                 <span
    //                     className={
    //                         !showCancelItem
    //                             ? "disabled-cancelitem-wrapper inline-block"
    //                             : "inline-block"
    //                     }
    //                 >
    //                     <Tooltip
    //                         target=".disabled-cancelitem-wrapper"
    //                         content="It is not part of Phase-1 Plan"
    //                         position="right"
    //                     />

    //                     <a
    //                         className="p-menuitem-link"
    //                         style={{
    //                             cursor: !showCancelItem ? "default" : "pointer",
    //                             opacity: !showCancelItem ? 0.5 : 1,
    //                             pointerEvents: "auto"
    //                         }}
    //                         onClick={(e) => {
    //                             if (!showCancelItem) {
    //                                 e.preventDefault();
    //                                 e.stopPropagation();
    //                                 return;
    //                             }

    //                             if (selectedUsers && selectedUsers.length >= 1) {
    //                                 setbtnDisabled(false);
    //                                 setDisplayConfirmation9(true);
    //                             } else {
    //                                 toast.current.show({
    //                                     severity: "error",
    //                                     summary: "Error",
    //                                     detail: "Please select 1 order item"
    //                                 });
    //                             }
    //                         }}
    //                     >
    //                         <span className={`${item.icon} mr-2`} />
    //                         <span className="p-menuitem-text">{item.label}</span>
    //                     </a>
    //                 </span>
    //             );
    //         }
    //     }
    // ];

    const menuLeft = useRef(null);
    const header = (
        <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
            <span className="block mt-2 md:mt-0 p-input-icon-left">
                <Menu model={actionItems} popup ref={menuLeft} id="popup_menu_left" />
                {actionItems.length > 0 &&(<Button label="Actions" icon="pi pi-align-left" className="mr-2" onClick={(event) => menuLeft.current.toggle(event)} aria-controls="popup_menu_left" aria-haspopup />)}
            </span>
        </div>
    );

    const userName = JSON.parse(localStorage.getItem("user"))?.user?.name;
    const userID = JSON.parse(localStorage.getItem("user"))?.user?.id;
    const adminuser =JSON.parse(localStorage.getItem("user"))?.user.user_role_id
    const userEmail = JSON.parse(localStorage.getItem("user"))?.user?.email;
    const onSubmitUser = () => {
        setbtnDisabled(true);
        const data = {
            ids: [selectedUsers.map(user => user.osi_ID).toString()],
            // itemids : [selectedUsers.map(user => user.product.split('-')[0].trim()).toString()],
            itemids : selectedUsers.map(u => ({itemId: u.product.split('-')[0].trim(), osi_Quantity: u.osi_Quantity,ori_Quantity: u.ori_Quantity})),
            pick_list_id : params.pick_list_id,
            picklist_id : params.id,
            osiorderitemid : selectedUsers[0].osi_OrderItemID,
            userName: userName,
            userID: userID,
            userEmail: userEmail
        };
        OrdersImportService.cancelItem((data)).then((data) => {
            setLoading(false);

            if (data.error == 0) {
                toast.current.show({ severity: 'success', summary: 'Success', detail: data.message });
                setSelectAll(false);
                setSelectedUsers([]);
                loadLazyData();

            }
            else {
                setSelectAll(false);
                setSelectedUsers([]);
                setbtnDisabled(false);
                toast.current.show({ severity: 'error', summary: 'Error', detail: data.message });
            }
            setbtnDisabled(false);
            setDisplayConfirmation9(false)
        });

    };


    const confirmationDialogFooter9 = (
        <div>
            <Button type="button" label="No" icon="pi pi-times" onClick={() => setDisplayConfirmation9(false)} className="p-button-text" />
            <Button type="button" disabled={btnDisabled} label="Yes" icon="pi pi-check" onClick={() => onSubmitUser()} className="p-button-text" autoFocus />
        </div>
    );
    return (
        <>
            <CancelOrderMenu />
            <Button
                label="Back"
                icon="pi pi-arrow-left"
                className="p-button-primary"
                onClick={() => navigate("/outbound/cancel-order")}
                style={{ margin: '10px 0' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3>PickList # {params.pick_list_id}</h3>
                {/* <div className='page-headerActions' style={{ display: "flex", gap: 30, alignItems: 'center' }}>
                <span onClick={() => setVisibleRight(true)} style={{ cursor: 'pointer', fontWeight: 500, fontSize: '18px', lineHeight: '21px', color: '#222222' }}><i className='pi pi-list' style={{ fontWeight: '600', fontSize: '20px' }}></i><span className='p-badge p-component p-badge-no-gutter p-badge-danger'></span>View Logs</span>
            </div> */}
            </div>
            <Helmet>
                <title>Order Task</title>
            </Helmet>
              <div
                style={{
                    display: 'flex',
                    width: '100%',
                    justifyContent: 'flex-end',   // ✅ forces extreme right
                    marginTop: '-2px',
                    marginBottom: '12px' 
                }}
            >
                <div
                    className="page-headerActions"
                    style={{
                        display: 'flex',
                        alignItems: 'center'
                    }}
                >
                    <span
                        onClick={() => setVisibleRight(true)}
                        style={{
                            cursor: 'pointer',
                            fontWeight: 500,
                            fontSize: '18px',
                            lineHeight: '21px',
                            color: '#222222',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                        }}
                    >
                        <i className="pi pi-list" style={{ fontWeight: 600, fontSize: '20px' }}></i>
                        <span className="p-badge p-component p-badge-no-gutter p-badge-danger"></span>
                        View Logs
                    </span>
                </div>
            </div>
            
                               <Sidebar className='logs_sidebar' visible={visibleRight} onHide={() => setVisibleRight(false)} baseZIndex={1000} position="right">
                            <div className='side_barHeader mt-4'>
                                <div className='left_centent'>Logs</div>
                            </div>
                             <div className='mt-6'>
                                <TabView>
                                    <TabPanel header="Logs">
                                        <Timeline className='logs_timeline' value={logs} content={customizedContent} />
                                    </TabPanel>
                                    <TabPanel header="Error Logs">
                                        <Timeline className='logs_timeline' value={errorLogs} content={customizedContent} />
            
                                    </TabPanel>
            
                                </TabView>
                            </div>
                             </Sidebar>
                             <Dialog header="Log Detail" visible={visible} style={{ width: '50vw' }} onHide={() => setVisible(false)}>
                            <p className="m-0" dangerouslySetInnerHTML={{ __html: dialogText }}>
                            </p>
                        </Dialog>
            <Toast ref={toast} />

            <Dialog header="Confirmation" visible={displayConfirmation9} style={{ width: '350px' }} onHide={() => setDisplayConfirmation9(false)} footer={confirmationDialogFooter9}>
                <div className="flex align-items-center justify-content-center">
                    <i className="pi pi-exclamation-triangle mr-3" style={{ fontSize: '2rem' }} />
                    <span>Warning: Please close any open Sage X3 window for this order before proceeding. If not closed, the cancellation will apply only in Mantis, not in Sage X3. Are you sure you want to proceed?</span>
                </div>
            </Dialog>

            <h1></h1>
            <div className="card">
                <h3>Order Shipment Item</h3>
                <DataTable
                    value={users}
                    lazy
                    filterDisplay="row"
                    dataKey="osi_ID"
                    paginator
                    showGridlines
                    first={lazyState.first}
                    rows={lazyState.rows}
                    totalRecords={totalRecords}
                    onPage={onPage}
                    onSort={onSort}
                    size={'small'}
                    sortField={lazyState.sortField}
                    className="datatable-responsive"
                    sortOrder={lazyState.sortOrder}
                    onFilter={onFilter}
                    filters={lazyState.filters}
                    rowsPerPageOptions={[25, 50, 100, 500]}
                    paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                    currentPageReportTemplate="Showing {first} to {last} of {totalRecords} records"
                    loading={loading}
                    tableStyle={{ minWidth: '75rem' }}
                    emptyMessage="No records found."
                    selection={selectedUsers}
                    onSelectionChange={onSelectionChange}
                    selectAll={selectAll}
                    onSelectAllChange={onSelectAllChange}
                    header={header}
                    scrollable
                    scrollHeight="600px"
                >
                    <Column selectionMode="multiple" headerStyle={{ width: '3rem' }} />
                    <Column field="product" header="Item" body={(rowData) => rowData.product} sortable filter showFilterMenu={false} filterPlaceholder="Search" />
                    <Column field="osi_Quantity" header="Quantity" body={(rowData) => rowData.osi_Quantity} sortable filter showFilterMenu={false} filterPlaceholder="Search" />
                    <Column field="ori_ItemUnit" header="Item Unit" body={(rowData) => rowData.ori_ItemUnit} sortable filter showFilterMenu={false} filterPlaceholder="Search" />
                    <Column field="osi_QuantitySU" header="Quantity Sale Unit" body={(rowData) => rowData.osi_QuantitySU} sortable />
                    <Column field="shipItemStatus" header="Item Status" body={nameBodyTemplate} sortable />
                </DataTable>
            </div>
        </>

    );
}
