
import React, { useState, useEffect, useRef } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from 'primereact/button';
import { BreadCrumb } from 'primereact/breadcrumb';
import { Helmet } from 'react-helmet';
import { Toast } from 'primereact/toast';
import { useDispatch, useSelector } from 'react-redux';
import { removeData } from "../../../../store/formMessage.slice"
import { UserSettingService } from '../../../../service/settings/UserSettingService';
import { SetupReportsService } from '../../../../service/setups/SetupReports';
import { useLazySort } from '../../../../components/useLazySort';
import { useAuth } from '../../../../store/useAuth';


export default function SetupReports() {
    const [loading, setLoading] = useState(false);
    const [totalRecords, setTotalRecords] = useState(0);
    const [users, setUsers] = useState(null);
    const [selectAll, setSelectAll] = useState(false);
    const [selectedUsers, setSelectedUsers] = useState(null);
    const toast = useRef();
    const navigate = useNavigate();
    const [lazyState, setlazyState] = useState({
        first: 0,
        rows: 25,
        page: 1,
        sortField: "",
        sortOrder: "",
        filters: {
            report_name: { value: null, matchMode: 'contains' },
            module: { value: null, matchMode: 'contains' },
            created_at: { value: null, matchMode: 'contains' },
            is_active: { value: null, matchMode: 'contains' },
        }
    });
   const { hasActionAccess, hasPageAccess } = useAuth();
            const PAGE_KEY = "setups_reports";
            const Detail_PAGE_KEY = "Reports_Setup_Details";
    const { onSort } = useLazySort(setlazyState);
    const formMessageDetail = useSelector((state) => state.formMessage.detail)
    const formMessageSeverity = useSelector((state) => state.formMessage.severity)
    const formMessageSummary = useSelector((state) => state.formMessage.summary)

    const dispatch = useDispatch()


    const items = [{ label: 'Other' }, { label: 'Reports'}];
    const home = { icon: 'pi pi-home', url: '/' }

    let networkTimeout = null;


    useEffect(() => {
        if(formMessageDetail != ''){
            toast.current.show({ severity: formMessageSeverity, summary: formMessageSummary, detail: formMessageDetail});
            dispatch(removeData());
        }
        loadLazyData();
    }, [lazyState]);

    const loadLazyData = () => {
        setLoading(true);

        if (networkTimeout) {
            clearTimeout(networkTimeout);
        }

        //imitate delay of a backend call
        networkTimeout = setTimeout(() => {
            SetupReportsService.getReportsGrid( (lazyState) ).then((data) => {
                setTotalRecords(data.totalRecords);
                setUsers(data.data);
                setLoading(false);
            });
        }, Math.random() * 100 + 250);
    };

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

    const onSelectAllChange = (event) => {
        const selectAll = event.checked;

        if (selectAll) {
            SetupReportsService.getReportsGrid().then((data) => {
                setSelectAll(true);
                setSelectedUsers(data.shipments);
            });
        } else {
            setSelectAll(false);
            setSelectedUsers([]);
        }
    };

    // const report_nameBodyTemplate = (rowData) => {
    //     return (
    //         <>
    //             <Link to={`${rowData.id}`}>{rowData.report_name}</Link>
    //         </>
    //     );
    // };

    const report_nameBodyTemplate = (rowData) => {
    const hasAccess = hasPageAccess(Detail_PAGE_KEY);

    return (
        <>
            {hasAccess ? (
                <Link to={`${rowData.id}`}>
                    {rowData.report_name}
                </Link>
            ) : (
                <span>
                    {rowData.report_name}
                </span>
            )}
        </>
    );
};

    const moduleBodyTemplate = (rowData) => {
        return (
            <>
                {rowData.module}
            </>
        );
    };
    const is_activeBodyTemplate = (rowData) => {
        return (
            <>
                {rowData.is_active ? 'Active' : 'Inactive'}
            </>
        );
    };
   const createdAtBodyTemplate = (rowData) => {
    if (!rowData?.created_at) return null;

    const date = new Date(rowData.created_at);

    const formattedDate = date.toLocaleString('en-US', {
        month: '2-digit',
        day: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
    });

    return <span>{formattedDate}</span>;
};

    const header = (
        <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
            <span className="block mt-2 md:mt-0 p-input-icon-left">
                <i className="pi pi-search" />
                {hasActionAccess(PAGE_KEY,"add_report") &&(<Button label="Add Report" icon="pi pi-plus" severity="sucess" onClick={() => navigate("/setup/reports/add")} />)}
            </span>
            
        </div>
    );


    return (
        <>
        <Helmet>
            <title>Dynamic Reports</title>
        </Helmet>
        <Toast ref={toast} />
        <BreadCrumb model={items} home={home} />
        
        <h1></h1>
        <div className="card">
            <h3>Dynamic Report</h3>
            <DataTable 
                value={users} 
                lazy 
                filterDisplay="row" 
                dataKey="id" 
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
                header={header}
                scrollable 
                scrollHeight="600px"
            >
                <Column selectionMode="multiple" headerStyle={{ width: '3rem' }} />
           
                <Column field="report_name" header="Report Name" body={report_nameBodyTemplate} filterMenuStyle={{ width: '14rem' }} showFilterMenu={false} sortable filter filterPlaceholder="Search" />
                <Column field="module" sortable header="Module Name" body={moduleBodyTemplate} showFilterMenu={false} filter filterPlaceholder="Search" />
                <Column field="is_active" sortable header="Is Active" body={is_activeBodyTemplate} showFilterMenu={false} filter filterPlaceholder="Search" />
                <Column field="created_at" sortable header="Created At" body={createdAtBodyTemplate} showFilterMenu={false} filter filterPlaceholder="Search" />

            </DataTable>
        </div>
        </>
        
    );
}
        