import React, { useState, useEffect, useRef } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { Toast } from 'primereact/toast';
import { Calendar } from 'primereact/calendar';
import { ProgressSpinner } from 'primereact/progressspinner';
import { useDispatch, useSelector } from 'react-redux';
import DashboardMenu from './DashboardMenu';
import { DashboardService } from '../../service/DashboardService';
import '../../assets/taskdashboard.css';
import { MultiSelect } from 'primereact/multiselect';
import { useLazySort } from '../../components/useLazySort';


export default function Tasks() {
    const [loading, setLoading] = useState(false);
    const [totalRecords, setTotalRecords] = useState(0);
    const [tasks, setTasks] = useState(null);
    const [selectedTasks, setSelectedTasks] = useState(null);
    const [loadingDetail, setLoadingDetail] = useState(true);
    const [taskDetailModel, setTaskDetailModel] = useState(false);
    const [taskDetail, setTaskDetail] = useState([]);
    const [taskCode, setTaskCode] = useState(null);
    const toast = useRef();
    const [dateFrom, setDateFrom] = useState(null);
    const [dateTo, setDateTo] = useState(null);
    const [datesSelected, setDatesSelected] = useState(false);
    const [debounceTimeout, setDebounceTimeout] = useState(null);
    const [nextCursor, setNextCursor] = useState(null);
    const [prevCursor, setPrevCursor] = useState(null);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [selectedTransactionTypes, setSelectedTransactionTypes] = useState([]);
    const [selectedStatuses, setSelectedStatuses] = useState([]);
    const rowsOptions = [10, 25, 50, 100]; 
    const dateFromRef = useRef(null);
    const dateToRef = useRef(null);
    
    const [lazyState, setlazyState] = useState({
        first: 0,
        rows: 25,
        page: 0,
        cursor : null,
        sortField: "",
        sortOrder: "",
        filters: {
            tsk_Code: { value: null, matchMode: 'contains' },
            Message: { value: null, matchMode: 'contains' },
            MessageName: { value: null, matchMode: 'contains' },
            productShortDescription: { value: null, matchMode: 'contains' },
            comboDescription: { value: null, matchMode: 'contains' },
            tsk_Quantity: { value: null, matchMode: 'contains' },
            tsk_SSCC: { value: null, matchMode: 'contains' },
            fromLocCode: { value: null, matchMode: 'contains' },
            tsk_ToLocationCode: { value: null, matchMode: 'contains' },
            taskOrder: { value: null, matchMode: 'contains' },
            ExecutionDate: { value: null, matchMode: 'contains' },
            Depositor: { value: null, matchMode: 'contains' },
            actualUser: { value: null, matchMode: 'contains' },
            transaction_type: { value: [], matchMode: "in" },
            status: { value: [], matchMode: "in" } 
        }
    });

        const { onSort } = useLazySort(setlazyState);
    

    useEffect(() => {
        if (!dateFrom && !dateTo) {
            loadLazyData();
        } 
        else if (dateFrom && dateTo) {
            const timeout = setTimeout(() => {
                loadLazyData();
            }, 300);

            return () => clearTimeout(timeout);
        }
    }, [lazyState, dateFrom, dateTo]);
    
    const handleTransactionTypeChange = (e) => {
        const selected = e.value;
        // Set the selected items (to show in UI)
        setSelectedTransactionTypes(selected);
    
        // Ensure we only keep valid values (though in this case, they should be valid already)
        const updatedTransactionTypes = selected && Array.isArray(selected)
            ? selected.filter(value => value !== undefined && value !== null) 
            : [];
    
        // Update lazyState only if the selected values change
        setlazyState(prev => ({
            ...prev,
            filters: {
                ...prev.filters,
                transaction_type: {
                    value: updatedTransactionTypes.length > 0 ? updatedTransactionTypes : null,
                    matchMode: 'in'
                }
            }
        }));
    };
    
    const handleStatusChange = (e) => {
        const selected = e.value;
        setSelectedStatuses(selected);
    
        setlazyState(prev => ({
            ...prev,
            filters: {
                ...prev.filters,
                status: {
                    value: selected.length > 0 ? selected : null,
                    matchMode: 'in'
                }
            }
        }));
    };

    const statusOptions = [
        { label: 'Pending', value: 1 },
        { label: 'Suspended', value: 5 },
        { label: 'Executing', value: 2 },
        { label: 'Execution failed', value: 6 },
        { label: 'Completed', value: 3 },
        { label: 'Cancelled', value: 4 }
    ];

    const handleDateChange = (type, value) => {
        const currentDate = new Date();
        const twoMonthsAgo = new Date();
        twoMonthsAgo.setMonth(currentDate.getMonth() - 2);

        // Validation
        if (value && value < twoMonthsAgo) {
            toast.current.show({
                severity: 'warn',
                summary: 'Warning',
                detail: 'The selected date is more than two months prior to the current date.',
            });
            // return; // optional
        }

        let newFrom = dateFrom;
        let newTo = dateTo;

        if (type === 'from') {
            newFrom = value;
            setDateFrom(value);
        } else if (type === 'to') {
            newTo = value;
            setDateTo(value);
        }

        // Reset pagination + cursor
        setlazyState(prev => ({
            ...prev,
            first: 0,
            cursor: null
        }));

        // Prevent API call if only one date is selected
        if ((newFrom && !newTo) || (!newFrom && newTo)) {
            return;
        }

        setTimeout(() => {
            loadLazyData();
        }, 300);
    };

    const loadLazyData = () => {
        // Prevent API call if only one date is selected
        if ((dateFrom && !dateTo) || (!dateFrom && dateTo)) {
            return;
        }

        setLoading(true);

        const data = {
            lazyState: lazyState,
            dateFrom: dateFrom
                ? new Date(dateFrom).toLocaleDateString('en-CA')
                : null,
            dateTo: dateTo
                ? new Date(dateTo).toLocaleDateString('en-CA')
                : null
        };

        DashboardService.getTaskDashboard(data)
            .then((response) => {
                setTasks(response.data?.data || []);
                setTotalRecords(response.data?.total || 0);
                setPrevCursor(response.data?.prev_cursor);
                setNextCursor(response.data?.next_cursor);
            })
            .catch(() => {
                toast.current.show({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Failed to load tasks'
                });
            })
            .finally(() => {
                setLoading(false);
            });
    };

    const handlePrev = () => {
        if (prevCursor) {
            setlazyState(prevState => ({
                ...prevState,    
                cursor: prevCursor  
            }));
        }
    };
    const handleRowsPerPageChange = (event) => {
        const selectedRows = Number(event.target.value);
        setRowsPerPage(selectedRows);
        setlazyState(prevState => ({
            ...prevState,    
            rows: selectedRows  
        }));
    };

    const handleNext = (event) => {
        setlazyState(prevState => ({
            ...prevState,    
            cursor: nextCursor 
        }));
        
        
    };
    const getTaskDetail = (taskCode) => {
        setTaskDetail(null);
        setTaskDetailModel(true);
        setTaskCode(taskCode);
        setLoadingDetail(true);
        
        const data = {
            dateFrom: dateFrom ? new Date(dateFrom).toLocaleDateString('en-CA') : null,
            dateTo: dateTo ? new Date(dateTo).toLocaleDateString('en-CA') : null,
            task_code: taskCode
        }
        
        DashboardService.getTaskDetail(data).then((response) => {
            setTaskDetail(response.data);
        }).finally(() => {
            setLoadingDetail(false);
        });
    }

    const closeDetailModal = () => {
        setTaskDetail(null);
        setTaskCode(null);
        setTaskDetailModel(false);
    };

    const refreshData = () => {
        // Clear dropdowns
        setSelectedTransactionTypes([]);
        setSelectedStatuses([]);

        // Reset lazyState
        setlazyState(prev => ({
            ...prev,
            first: 0, // reset pagination
            filters: {}
        }));

        // Reload data
        loadLazyData();
    };

    const clearDateFilters = () => {
        setDateFrom(null);
        setDateTo(null);
        setDatesSelected(false);
        // Trigger API call with no date filters
        loadLazyData();
    };

    const header = (
        <div className="flex flex-wrap align-items-center justify-content-between gap-2">
            <div className="flex flex-wrap align-items-center gap-2">
                <span className="p-float-label">
                    <Calendar 
                        ref={dateFromRef}
                        id="dateFrom"
                        value={dateFrom} 
                        onChange={(e) => handleDateChange('from', e.value)} 
                        showIcon
                        showOnFocus={false} 
                        dateFormat="yy-mm-dd"
                        maxDate={dateTo || new Date()}
                        className="p-calendar"
                        inputRef={(el) => {
                            if (el) {
                                el.onmousedown = (e) => {
                                    e.preventDefault();           
                                    dateFromRef.current.show(); 
                                };
                            }
                        }}
                    />
                    <label htmlFor="dateFrom">Date From</label>
                </span>
                
                <span className="p-float-label">
                    <Calendar 
                        ref={dateToRef}
                        id="dateTo"
                        value={dateTo} 
                        onChange={(e) => handleDateChange('to', e.value)} 
                        showIcon
                        showOnFocus={false} 
                        dateFormat="yy-mm-dd"
                        minDate={dateFrom}
                        maxDate={new Date()}
                        className="p-calendar"
                        inputRef={(el) => {
                            if (el) {
                                el.onmousedown = (e) => {
                                    e.preventDefault();           
                                    dateToRef.current.show(); 
                                };
                            }
                        }}
                    />
                    <label htmlFor="dateTo">Date To</label>
                </span>
    
                <Button 
                    label="Clear Dates" 
                    onClick={clearDateFilters} 
                    severity="secondary" 
                    className="p-button-outlined button-spacing"
                    size="small"
                />
            </div>
            <MultiSelect
                value={selectedTransactionTypes}
                onChange={handleTransactionTypeChange}
                options={[
                    { label: "Loading", value: 10 },
                    { label: "Move to production", value: 15 },
                    { label: "Picking", value: 3 },
                    { label: "Putaway", value: 2 },
                    { label: "Receive produced", value: 16 },
                    { label: "Removal", value: 11 },
                    { label: "Replenishment", value: 13 },
                    { label: "Transfer", value: 7 },
                    { label: "Warehouse transfer", value: 19 }
                ]}
                optionLabel="label"
                placeholder="Select Transaction Types"
                filter
                className="w-full md:w-20rem"
            />
            <MultiSelect
                value={selectedStatuses}
                options={statusOptions}
                onChange={handleStatusChange}
                optionLabel="label"
                placeholder="Select Status"
                filter
                className="w-full md:w-20rem"
            />

            <Button 
                label="Refresh" 
                loading={loading} 
                onClick={refreshData} 
                severity="success" 
                icon="pi pi-refresh" 
                size="small" 
            />
        </div>
    );
    

    return (
        <>
            <DashboardMenu />
            
            <Toast ref={toast} />
            
            <div className="card">
                <h3>Task Dashboard</h3>
                <DataTable 
                    value={tasks} 
                    lazy 
                    filterDisplay="row" 
                    dataKey="tsk_ID" 
                    showGridlines
                    paginator
                    first={lazyState.first} 
                    rows={lazyState.rows} 
                    totalRecords={totalRecords} 
                    onPage={(e) => setlazyState(e)}
                    onSort={onSort} 
                    size={'small'}
                    sortField={lazyState.sortField}    
                    className="datatable-responsive"
                    sortOrder={lazyState.sortOrder}
                    onFilter={(e) => {
                        e['first'] = 0;
                        setlazyState(e);
                    }}
                    filters={lazyState.filters} 
                    rowsPerPageOptions={[25, 50, 100, 500, 1000, 5000]}
                     paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                    currentPageReportTemplate="Showing {first} to {last} of {totalRecords} records"
                    loading={loading} 
                    tableStyle={{ minWidth: '75rem' }}
                    emptyMessage="No tasks found."
                    selection={selectedTasks} 
                    onSelectionChange={(e) => setSelectedTasks(e.value)}
                    scrollable 
                    header={header}
                    scrollHeight="600px"
                    
                >
                    <Column field="tsk_Code" header="Task Code" headerStyle={{ width: '7rem' }} sortable  showFilterMenu={false} filter filterPlaceholder="Search"/>
                    <Column field="message" header="Trasaction Type" sortable  headerStyle={{ width: '8rem' }} showFilterMenu={false}  />
                    <Column field="messageName" header="Status" sortable headerStyle={{ width: '8rem' }} showFilterMenu={false} />
                    <Column field="productShortDescription" header="Item" headerStyle={{ width: '14rem' }} showFilterMenu={false} sortable filter filterPlaceholder="Search" />
                    <Column field="comboDescription" header="Pack Type" headerStyle={{ width: '8rem' }} showFilterMenu={false} sortable filter filterPlaceholder="Search" />
                    <Column field="tsk_Quantity" header="Quantity"  headerStyle={{ width: '7rem' }} showFilterMenu={false} sortable filter filterPlaceholder="Search" />
                    <Column field="tsk_SSCC" header="SSCC" headerStyle={{ width: '9rem' }}  showFilterMenu={false} sortable filter filterPlaceholder="Search" />
                    <Column field="fromLocCode" header="Start Location" headerStyle={{ width: '8rem' }} showFilterMenu={false} sortable  filter filterPlaceholder="Search"/>
                    <Column field="tsk_ToLocationCode" header="Destination Location" headerStyle={{ width: '9rem' }} showFilterMenu={false} sortable filter filterPlaceholder="Search" />
                    <Column field="taskOrder" header="Order Number" headerStyle={{ width: '9rem' }} sortable  showFilterMenu={false}  filter filterPlaceholder="Search"/>
                    <Column 
                        field="executionDate" 
                        header="Execution Date" 
                        sortable 
                        headerStyle={{ width: '9rem' }}
                        showFilterMenu={false}
                        body={(rowData) =>
                            rowData.tkl_CompleteDate
                                ? rowData.tkl_CompleteDate
                                : ''
                        }
                    />
                    <Column field="actualUser" header="Executed By" headerStyle={{ width: '10rem' }}showFilterMenu={false} sortable filter filterPlaceholder="Search" />
                </DataTable>
            </div>
        </>
    );
}