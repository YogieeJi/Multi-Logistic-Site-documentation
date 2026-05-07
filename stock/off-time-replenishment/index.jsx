import React, { useState, useEffect, useRef } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Dropdown } from 'primereact/dropdown';
import { Badge } from 'primereact/badge';
import { BreadCrumb } from 'primereact/breadcrumb';
import { Helmet } from 'react-helmet';
import { Tag } from 'primereact/tag';
import { Dialog } from 'primereact/dialog';
import { Toast } from 'primereact/toast';
import { OfftimeReplenishment } from '../../../service/operations/OffTimeReplenishmentservice';
import titles from '../../titles';
import { Button } from 'primereact/button';
import { Menu } from 'primereact/menu';
import { useAuth } from '../../../store/useAuth';

export default function OffTimeReplenishment() {
    const { hasActionAccess } = useAuth();
    const PAGE_KEY = "off-time-replenishment";
    const [loading, setLoading] = useState(true);
    const [totalRecords, setTotalRecords] = useState(0);
    const [logs, setLogs] = useState(null);
    const [selectAll, setSelectAll] = useState(false);
    const [selectedLogs, setSelectedLogs] = useState(null);
    const [visible, setVisible] = useState(false);
    const [displayConfirmation1, setDisplayConfirmation1] = useState(false);
    const [btnDisabled, setbtnDisabled] = useState(true);
    const [currentDateTime, setCurrentDateTime] = useState(localStorage.getItem("datetime"));
    const [displayConfirmationDeleteAll, setDisplayConfirmationDeleteAll] = useState(false);
    const [itemToRemove, setItemToRemove] = useState(null); // State to hold the item to be removed
    const [dialog, setDialog] = useState(false);
    const [cancel, setcancel] = useState('false');
    const toast = useRef();
    const [lazyState, setlazyState] = useState({
        first: 0,
        rows: 10,
        page: 0,
        sortField: "",
        sortOrder: "",
        filters: {
            suggested_loc: { value: null, matchMode: 'contains' },
            sav_Value: { value: null, matchMode: 'contains' },
            prd_PrimaryCode: { value: null, matchMode: 'contains' },
            loc_aisle23: { value: null, matchMode: 'contains' },
            exp_Date: { value: null, matchMode: 'contains' },
        }
    });

    const items = [{ label: 'Task' }, { label: 'Off time Replenishment' }];
    const home = { icon: 'pi pi-home', url: '/' };

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
            OfftimeReplenishment.GetOffTimeReplenishment(lazyState)
                .then((response) => {
                    if (response && response.data) {
                        const { data, totalRecords } = response;
                        if (data.length === 0) {
                            setTotalRecords(0);
                            setLogs(null);
                        } else {
                            setTotalRecords(totalRecords || 0);
                            setLogs(data);
                        }
                    } else {
                        setTotalRecords(0);
                        setLogs(null);
                    }
                })
                .catch((error) => {
                    console.error("Error fetching failed jobs:", error);
                    setTotalRecords(0);
                    setLogs(null);
                })
                .finally(() => {
                    setLoading(false);
                });
        }, Math.random() * 100 + 250);
    };

    const onPage = (event) => {
        setlazyState(event);
    };

    const onSort = (event) => {
        setlazyState(event);
    };

    const onFilter = (event) => {
        event['first'] = 0;
        setlazyState(event);
    };

    const Refresh = () => {
        loadLazyData();
    };

    const onSelectionChange = (event) => {
        const value = event.value;
        setSelectedLogs(value);
        setSelectAll(value.length === totalRecords);
    };

    const onSelectAllChange = (event) => {
        const selectAll = event.checked;
        if (selectAll) {
            setSelectAll(true);
            setSelectedLogs(logs);
        } else {
            setSelectAll(false);
            setSelectedLogs([]);
        }
    };

    const replenishment = () => {
        setLoading(true);

        if (networkTimeout) {
            clearTimeout(networkTimeout);
        }
        const data = {
            cancel: cancel
        };

       networkTimeout = setTimeout(() => {
                OfftimeReplenishment.CreateOffTimeReplenishment(data)
                    .then((response) => {
                        setLoading(false);

                        if (response) {
                            if (response.error == 0) {
                                if (response.message == "A task is already running.") {
                                    setcancel('true');
                                    const lastExecutionTime = response.last_execution_time;
                                     setCurrentDateTime(lastExecutionTime);
                                    localStorage.setItem("datetime", lastExecutionTime);
                                    setDialog(true);
                                    toast.current.show({ severity: 'warn', summary: 'Warning', detail: response.message });
                                }  else if (response.message == "Task marked for cancellation.") {
                                    setcancel('false');
                                      toast.current.show({ severity: 'success', summary: 'Cancelled', detail: response.message });
                                      loadLazyData();
                                }else {
                                    // Normal success flow
                                    const lastExecutionTime = response.last_execution_time;
                                    setCurrentDateTime(lastExecutionTime);
                                    localStorage.setItem("datetime", lastExecutionTime);
                                    toast.current.show({ severity: 'success', summary: 'Success', detail: response.message });
                                    setSelectAll(false);
                                    setSelectedLogs(null);
                                    loadLazyData();
                                }
                            } else {
                                toast.current.show({ severity: 'error', summary: 'Error', detail: 'An unexpected error occurred. Please try again later.' });
                            }
                        } else {
                            toast.current.show({ severity: 'error', summary: 'Error', detail: 'No response from server.' });
                        }

                        setbtnDisabled(false);
                        setVisible(false);
                    })
                    .catch((error) => {
                        setLoading(false);
                        setbtnDisabled(false);
                        setVisible(false);
                        handleError(error);
                    });
            }, Math.random() * 100 + 250);
                      

    };

    const removeItemsPopup = (id) => {
        setItemToRemove(id); // Set the item ID to be removed
        setDisplayConfirmation1(true);
        setbtnDisabled(false); // Enable buttons when the dialog is opened
    };
    const deleteAllItems = () => {
        setLoading(true);
        setDisplayConfirmationDeleteAll(false); 
        setbtnDisabled(true); 
        const idsToDelete = selectedLogs.map(log => log.tsk_ID); 
    
        // Create the data object correctly
        const data = {
            ids: idsToDelete // Use a key to store the array of IDs
        };
    
        if (networkTimeout) {
            clearTimeout(networkTimeout);
        }
    
        networkTimeout = setTimeout(() => {
            console.log(idsToDelete);
    
            OfftimeReplenishment.MultipleDeleteGetOffTimeReplenishment(data) // Call the delete API with the object
                .then((response) => {
                    setLoading(false);
                    if (response) {
                        switch (response.error) {
                            case 0:
                                toast.current.show({ severity: 'success', summary: 'Success', detail: response.message });
                                loadLazyData(); // Refresh the data after deletion
                                break;
                            case 1:
                                toast.current.show({ severity: 'error', summary: 'Error', detail: response.message });
                                break;
                            default:
                                toast.current.show({ severity: 'error', summary: 'Error', detail: 'An unexpected error occurred. Please try again later.' });
                        }
                    } else {
                        toast.current.show({ severity: 'error', summary: 'Error', detail: 'No response from server.' });
                    }
                    setDisplayConfirmationDeleteAll(false); // Close the confirmation dialog
                    setbtnDisabled(false); // Re-enable the button after the operation
                })
                .catch((error) => {
                    setLoading(false);
                    handleError(error);
                    setbtnDisabled(false); // Re-enable the button in case of error
                });
        }, Math.random() * 100 + 250);
    };
    const removeItem = () => {
        setLoading(true);
        setbtnDisabled(true); // Disable the button when the action is initiated
        if (networkTimeout) {
            clearTimeout(networkTimeout);
        }

        networkTimeout = setTimeout(() => {
            OfftimeReplenishment.DeleteOffTimeReplenishment(itemToRemove) // Call the delete API with the item ID
                .then((response) => {
                    setLoading(false);
                    // Handle different error codes
                    if (response) {
                        switch (response.error) {
                            case 0:
                                toast.current.show({ severity: 'success', summary: 'Success', detail: response.message });
                                loadLazyData(); // Refresh the data after deletion
                                break;
                            case 1:
                                toast.current.show({ severity: 'error', summary: 'Error', detail: response.message });
                                break;
                            default:
                                toast.current.show({ severity: 'error', summary: 'Error', detail: 'An unexpected error occurred. Please try again later.' });
                        }
                    } else {
                        toast.current.show({ severity: 'error', summary: 'Error', detail: 'No response from server.' });
                    }
                    setDisplayConfirmation1(false); // Close the confirmation dialog
                    setbtnDisabled(false); // Re-enable the button after the operation
                })
                .catch((error) => {
                    setLoading(false);
                    handleError(error);
                    setbtnDisabled(false); // Re-enable the button in case of error
                });
        }, Math.random() * 100 + 250);
    };

    const handleError = (error) => {
        if (error.response) {
            toast.current.show({ severity: 'error', summary: 'Error', detail: `Server error: ${error.response.status} - ${error.response.statusText}` });
        } else if (error.request) {
            toast.current.show({ severity: 'error', summary: 'Error', detail: 'No response received from the server. Please check your network connection.' });
        } else {
            toast.current.show({ severity: 'error', summary: 'Error', detail: 'An error occurred while processing your request. Please try again later.' });
        }
    };

    const actionBodyTemplate = (rowData) => {
        return (<Button type="button" onClick={() => removeItemsPopup(rowData.tsk_ID)} severity="danger" icon="pi pi-trash" rounded></Button>);
    };

    const actionItems = [
        hasActionAccess(PAGE_KEY, "create_off_time_replenishment")&&{
            label: 'Create Off Time Replenishment',
            icon: 'fa fa-plus',
            command: () => {
                setVisible(true);
                setbtnDisabled(false);
            },
        },
        hasActionAccess(PAGE_KEY, "delete_all")&&{
            label: 'Delete All',
            icon: 'fa fa-trash',
            command: () => {

                if(selectedLogs != null && selectedLogs.length > 0){
                    setDisplayConfirmationDeleteAll(true); 
                    setbtnDisabled(false);
                } else{
                    toast.current.show({ severity: 'error', summary: 'Error', detail: 'Atleast select 1 task' });
                }
               
            },
        }
    ].filter(Boolean);

    const menuLeft = useRef(null);
    const header = (
        <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
            <span className="block mt-2 md:mt-0 p-input-icon-left">
                {actionItems.length > 0 && (<><Menu model={actionItems} popup ref={menuLeft} id="popup_menu_left" />
                <Button label="Actions" icon="pi pi-align-left" className="mr-2" onClick={(event) => menuLeft.current.toggle(event)} aria-controls="popup_menu_left" aria-haspopup /> </>)}
            </span>
        </div>
    );

    const confirmationDialogFooter2 = (
        <>
            <Button type="button" label="No" disabled={btnDisabled} icon="pi pi-times" onClick={() => setVisible(false)} className="p-button-text" />
            <Button type="button" label="Yes" disabled={btnDisabled} icon="pi pi-check" onClick={replenishment} className="p-button-text" autoFocus />
        </>
    );
    const confirmationDialogFooter3 = (
        <>
            <Button type="button" label="No" disabled={btnDisabled} icon="pi pi-times" onClick={() => setDialog(false)} className="p-button-text" />
            <Button type="button" label="Yes" disabled={btnDisabled} icon="pi pi-check" onClick={() =>{setcancel('true');replenishment(); setDialog(false)}} className="p-button-text" autoFocus />
        </>
    );

    const confirmationDialogFooter1 = (
        <>
            <Button type="button" disabled={btnDisabled} label="No" icon="pi pi-times" onClick={() => setDisplayConfirmation1(false)} className="p-button-text" />
            <Button type="button" disabled={btnDisabled} label="Yes" icon="pi pi-check" onClick={removeItem} className="p-button-text" autoFocus />
        </>
    );

    const statusDropdownList = [
        { id: 'Status_Pending', order_type: 'Status Pending', severity: 'warning' },
        { id: 'Status_Executing', order_type: 'Status Executing', severity: 'info' },
        { id: 'Status_Done', order_type: 'Status Done', severity: 'success' },
        { id: 'Status_Cancelled', order_type: 'Status Cancelled', severity: 'danger' },
        { id: 'Status_Suspended', order_type: 'Status Suspended', severity: 'secondary' },
        { id: 'Status_Incomplete', order_type: 'Status Incomplete', severity: 'error' }
    ];

    const OrderTypeRowFilterTemplate = (options) => {
        return (
            <Dropdown
                style={{ minWidth: '3em', width: '3em' }}
                value={options.id}
                optionValue="id"
                optionLabel="order_type"
                options={statusDropdownList}
                onChange={(e) => options.filterApplyCallback(e.value)}
                placeholder="Select Status"
                className="p-column-filter"
                showClear
                itemTemplate={(option) => (
                    <div className="p-d-flex p-ai-center">
                        <Badge value={option.order_type} severity={option.severity} />
                    </div>
                )}
            />
        );
    };

    const nameBodyTemplate = (rowData) => {
        return (
            <>
                {rowData.pst_MessageCode === 'Status_Pending' && (
                    <Badge value="Status_Pending" severity="warning" />
                )}
                {rowData.pst_MessageCode === 'Status_Executing' && (
                    <Badge value="Status_Executing" severity="info" />
                )}
                {rowData.pst_MessageCode === 'Status_Done' && (
                    <Badge value="Status_Done" severity="success" />
                )}
                {rowData.pst_MessageCode === 'Status_Cancelled' && (
                    <Badge value="Status_Cancelled" severity="danger" />
                )}
                {rowData.pst_MessageCode === 'Status_Suspended' && (
                    <Badge value="Status_Suspended" severity="secondary" />
                )}
                {rowData.pst_MessageCode === 'Status_Incomplete' && (
                    <Badge value="Status_Incomplete" severity="error" />
                )}
            </>
        );
    };

    return (
        <>
         <Dialog header="Confirmation" visible={displayConfirmationDeleteAll} onHide={() => setDisplayConfirmationDeleteAll(false)} style={{ width: '350px' }} modal footer={
            <>
                <Button type="button" label="No" disabled={btnDisabled} icon="pi pi-times" onClick={() => setDisplayConfirmationDeleteAll(false)} className="p-button-text" />
                <Button type="button" label="Yes" disabled={btnDisabled} icon="pi pi-check" onClick={deleteAllItems} className="p-button-text" autoFocus />
            </>
        }>
            <div className="flex align-items-center justify-content-center">
                <i className="pi pi-exclamation-triangle mr-3" style={{ fontSize: '2rem' }} />
                <span>Are you sure you want to delete all tasks?</span>
            </div>
        </Dialog>
            <Dialog closable={false} header="Confirmation" visible={displayConfirmation1} onHide={() => setDisplayConfirmation1(false)} style={{ width: '350px' }} modal footer={confirmationDialogFooter1}>
                <div className="flex align-items-center justify-content-center">
                    <i className="pi pi-exclamation-triangle mr-3" style={{ fontSize: '2rem' }} />
                    <span>Are you sure you want to remove this task?</span>
                </div>
            </Dialog>
            <div className="flex flex-row-reverse flex-wrap">
                <div className="flex align-items-center justify-content-center mb-3">
                    <Button
                        label="Refresh"
                        loading={loading}
                        onClick={Refresh}
                        severity="success"
                        icon="pi pi-refresh"
                        className="align-item-right"
                        size="small"
                    />
                </div>
            </div>
            <Helmet>
                <title>{titles.Con}</title>
            </Helmet>
            <Toast ref={toast} />
            <BreadCrumb model={items} home={home} />
            <Dialog header="Confirmation" visible={visible} onHide={() => setVisible(false)} style={{ width: '350px' }} modal footer={confirmationDialogFooter2}>
                <div className="flex align-items-center justify-content-center">
                    <i className="pi pi-exclamation-triangle mr-3" style={{ fontSize: '2rem' }} />
                    <span>Are you sure you want to proceed?</span>
                </div>
            </Dialog>
            <Dialog header="Confirmation" visible={dialog} onHide={() => setDialog(false)} style={{ width: '350px' }} modal footer={confirmationDialogFooter3}>
                <div className="flex align-items-center justify-content-center">
                    <i className="pi pi-exclamation-triangle mr-3" style={{ fontSize: '2rem' }} />
                    <span>Are you sure you want to cancel  Off Time Replenishment?</span>
                </div>
            </Dialog>
            <h1></h1>
            <div className="card p-4 shadow-md rounded-lg">
                <div className="flex items-center justify-between w-full">
                    <h3 className="mr-auto">Off Time Replenishment</h3>
                    <div className="flex items-center">
                        <h3 className="font-medium whitespace-nowrap">Last executed at:</h3>
                        <p className="ml-2">{currentDateTime}</p>
                    </div>
                </div>

                <DataTable
                    value={logs}
                    lazy
                    filterDisplay="row"
                    dataKey="tsk_SSCC"
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
                    rowsPerPageOptions={[10, 25, 50, 100]}
                    paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                    currentPageReportTemplate="Showing {first} to {last} of {totalRecords} records"
                    loading={loading}
                    tableStyle={{ minWidth: '75rem' }}
                    emptyMessage="No data found."
                    selection={selectedLogs}
                    onSelectAllChange={onSelectAllChange}
                    onSelectionChange={onSelectionChange}
                    selectAll={selectAll}
                    scrollable
                    header={header}
                    scrollHeight="600px"
                    removableSort
                >
                    <Column selectionMode="multiple" headerStyle={{ width: '3rem' }} />
                    <Column field="tsk_FromLocationCode" sortable header="From Location" body={(rowData) => rowData.tsk_FromLocationCode} style={{ width: '9rem' }} showFilterMenu={false} />
                    <Column field="tsk_ToLocationCode" style={{ width: '9rem' }} header="To Location" body={(rowData) => rowData.tsk_ToLocationCode} filterMenuStyle={{ width: '9rem' }} showFilterMenu={false} sortable />
                    <Column field="prdl_Description" headerStyle={{ width: '40rem' }} header="Description" body={(rowData) => rowData.prdl_Description} style={{ width: '9rem' }} />
                    <Column field="tsk_SSCC" header="SSCC" body={(rowData) => rowData.tsk_SSCC} style={{ width: '9rem' }} />
                    <Column field="tsk_Quantity" header="Quantity" body={(rowData) => rowData.tsk_Quantity} style={{ width: '9rem' }} filterMenuStyle={{ width: '3rem' }} sortable showFilterMenu={false} />
                    <Column field="created_user" header="Created User" body={(rowData) => rowData.created_user} style={{ width: '9rem' }} sortable showFilterMenu={false} />
                    <Column field="assign_user" header="Assign User" style={{ width: '9rem' }} body={(rowData) => rowData.assign_user} sortable showFilterMenu={false} />
                    <Column field="pst_MessageCode" header="Status" body={nameBodyTemplate} />
                    <Column headerStyle={{ width: '5rem', textAlign: 'center' }} bodyStyle={{ textAlign: 'center', overflow: 'visible' }} header="Action" body={actionBodyTemplate} />
                </DataTable>
            </div>
        </>
    );
}