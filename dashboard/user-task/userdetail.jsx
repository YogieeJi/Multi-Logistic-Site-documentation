import React, { useState, useEffect, useRef, useCallback } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Button } from 'primereact/button';
import { Helmet } from 'react-helmet';
import { Toast } from 'primereact/toast';
import { useDispatch, useSelector } from 'react-redux';
import { removeData } from "../../../store/formMessage.slice";
import { DashboardService } from '../../../service/DashboardService';
import UserDashboardMenu from './userDashboardMenu';
import { useLazySort } from '../../../components/useLazySort';

export default function Users() {
    const [loading, setLoading] = useState(false);
    const [totalRecords, setTotalRecords] = useState(0);
    const [users, setUsers] = useState([]); //start as empty array, not null
    const [selectAll, setSelectAll] = useState(false);
    const [selectedUsers, setSelectedUsers] = useState([]);
    const toast = useRef();
    const navigate = useNavigate();
    const params = useParams();
    const dispatch = useDispatch();

    const formMessageDetail = useSelector((state) => state.formMessage.detail);
    const formMessageSeverity = useSelector((state) => state.formMessage.severity);
    const formMessageSummary = useSelector((state) => state.formMessage.summary);

    const [lazyState, setLazyState] = useState({
        first: 0,
        rows: 25,
        page: 0,
        sortField: "",
        sortOrder: "",
        filters: {
            trt_MessageCode: { value: null, matchMode: 'contains' },
            tsk_Code: { value: null, matchMode: 'contains' },
            prd_PrimaryCode: { value: null, matchMode: 'contains' },
            tsk_FromLocationCode: { value: null, matchMode: 'contains' },
            tsk_ToLocationCode: { value: null, matchMode: 'contains' },
            log_startdatetime: { value: null, matchMode: 'contains' },
            TimeInHHMMSS: { value: null, matchMode: 'contains' },
        }
    });

    const { onSort } = useLazySort(setLazyState);

    //Fetch data function - memoized to prevent stale closures
    const loadLazyData = useCallback(async () => {
        setLoading(true);
        setUsers([]); // clear existing data to avoid stale/duplicate display

        const payload = {
            lazyState,
            id: params.id,
            date: params.date,
            name: params.name
        };

        try {
            const response = await DashboardService.getUserTaskLogDetail(payload);
            if (response && response.data) {
                setUsers(response.data);
                setTotalRecords(response.totalRecords || 0);
            } else {
                setUsers([]);
                setTotalRecords(0);
            }
        } catch (err) {
            console.error("Data load error:", err);
            setUsers([]);
            setTotalRecords(0);
        } finally {
            setLoading(false);
        }
    }, [lazyState, params]);

    useEffect(() => {
        if (formMessageDetail !== '') {
            toast.current.show({
                severity: formMessageSeverity,
                summary: formMessageSummary,
                detail: formMessageDetail
            });
            dispatch(removeData());
        }

        loadLazyData();
    }, [lazyState, formMessageDetail, formMessageSeverity, formMessageSummary, dispatch, loadLazyData]);

    
    const onPage = (event) => {
        setLazyState((prev) => ({
            ...prev,
            first: event.first,
            rows: event.rows,
            page: event.page
        }));
    };

    const onFilter = (event) => {
        event['first'] = 0;
        setLazyState((prev) => ({
            ...prev,
            first: 0,
            filters: event.filters
        }));
    };

    const onSelectionChange = (event) => {
        const value = event.value;
        setSelectedUsers(value);
        setSelectAll(value.length === totalRecords);
    };

    const onSelectAllChange = (event) => {
        const checked = event.checked;
        setSelectAll(checked);
        setSelectedUsers(checked ? [...users] : []);
    };

    return (
        <>
            <UserDashboardMenu />

            <Button
                label="Back"
                icon="pi pi-arrow-left"
                className="p-button-primary"
                onClick={() => navigate('/user-task-dashboard')}
                style={{ margin: '10px 0' }}
            />

            <Helmet>
                <title>User Task Detail</title>
            </Helmet>

            <Toast ref={toast} />

            <div className="card">
                <div className="p-fluid formgrid grid">
                    <div className="field col-12 md:col-4">
                        <h4>User Name:</h4>
                        <p>{params.name}</p>
                    </div>
                    <div className="field col-12 md:col-4">
                        <h4>Date:</h4>
                        <p>{new Date(params.date).toLocaleDateString('en-CA')}</p>
                    </div>
                </div>
            </div>

            <div className="card">
                <h3>User Task Log Detail</h3>

                <DataTable
                    value={users}
                    lazy
                    filterDisplay="row"
                    dataKey="log_id"
                    paginator
                    showGridlines
                    first={lazyState.first}
                    rows={lazyState.rows}
                    totalRecords={totalRecords}
                    onPage={onPage}
                    onSort={onSort}
                    sortField={lazyState.sortField}
                    sortOrder={lazyState.sortOrder}
                    onFilter={onFilter}
                    filters={lazyState.filters}
                    rowsPerPageOptions={[25, 50, 100, 500, 1000]}
                    paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                    currentPageReportTemplate="Showing {first} to {last} of {totalRecords} records"
                    loading={loading}
                    tableStyle={{ minWidth: '75rem' }}
                    emptyMessage="No records found."
                    selection={selectedUsers}
                    onSelectionChange={onSelectionChange}
                    selectAll={selectAll}
                    onSelectAllChange={onSelectAllChange}
                    scrollable
                    scrollHeight="600px"
                >
                    <Column field="tsk_Code" header="Task Code" sortable />
                    <Column field="trt_MessageCode" header="Task Type" sortable />
                    <Column field="unt_code" header="Unit Code" sortable />
                    <Column field="tsk_Quantity" header="Task Quantity" sortable />
                    <Column field="prd_PrimaryCode" header="Item" sortable />
                    <Column field="tsk_FromLocationCode" header="From Location" sortable />
                    <Column field="tsk_ToLocationCode" header="To Location" sortable />
                    <Column field="startTime" header="Start Time" sortable />
                    <Column field="totalDuration" header="Total Duration" sortable />
                    <Column field="finishTime" header="Finish Time" sortable />
                    <Column field="breakTime" header="Break Time" sortable />
                </DataTable>
            </div>
        </>
    );
}
