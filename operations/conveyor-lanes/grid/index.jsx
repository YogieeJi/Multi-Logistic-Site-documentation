
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
import { ConveyorLanesService } from '../../../../service/operations/ConveyorLanesService';
import { Badge } from 'primereact/badge';
import { useLazySort } from '../../../../components/useLazySort';
import { useAuth } from '../../../../store/useAuth';


export default function ConveyorLanes() {
    const [loading, setLoading] = useState(false);
    const [totalRecords, setTotalRecords] = useState(0);
    const [lanes, setLanes] = useState(null);
    const [selectAll, setSelectAll] = useState(false);
    const [selectedLanes, setSelectedLanes] = useState(null);
    const toast = useRef();
    const navigate = useNavigate();
    const [lazyState, setlazyState] = useState({
        first: 0,
        rows: 25,
        page: 1,
        sortField: "",
        sortOrder: "",
        filters: {
            title: { value: null, matchMode: 'contains' },
            conveyor_name: { value: null, matchMode: 'contains' },
            conveyor_id: { value: null, matchMode: 'contains' },
            lane_type: { value: null, matchMode: 'contains' },
        }
    });
    const { hasActionAccess, hasPageAccess } = useAuth();

    const PAGE_KEY = "operations_conveyorLanes";
    const Detail_PAGE_KEY = "Conveyor_Lanes_details";
    
    const { onSort } = useLazySort(setlazyState);
    const formMessageDetail = useSelector((state) => state.formMessage.detail)
    const formMessageSeverity = useSelector((state) => state.formMessage.severity)
    const formMessageSummary = useSelector((state) => state.formMessage.summary)

    const dispatch = useDispatch()


    const items = [{ label: 'Conveyor' }, { label: 'Conveyor Lanes'}];
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

        networkTimeout = setTimeout(() => {
            ConveyorLanesService.getLaneGrid( (lazyState) ).then((data) => {
                setTotalRecords(data.totalRecords);
                setLanes(data.data);
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

        setSelectedLanes(value);
        setSelectAll(value.length === totalRecords);
    };

    const onSelectAllChange = (event) => {
        const selectAll = event.checked;

        if (selectAll) {
            ConveyorLanesService.getLaneGrid().then((data) => {
                setSelectAll(true);
                setSelectedLanes(data.shipments);
            });
        } else {
            setSelectAll(false);
            setSelectedLanes([]);
        }
    };

    // const titleBodyTemplate = (rowData) => {
    //     return (
    //         <>
    //             <Link to={`${rowData.id}`}>{rowData.title}</Link>
    //         </>
    //     );
    // };

    const titleBodyTemplate = (rowData) => {
    const hasDetailAccess = hasPageAccess(Detail_PAGE_KEY);

    return hasDetailAccess ? (
        <Link to={`${rowData.id}`}>{rowData.title}</Link>
    ) : (
        <span>{rowData.title}</span>
    );
};

    const nameBodyTemplate = (rowData) => {
        return (
            <>
                {rowData.conveyor_name}
            </>
        );
    };
    const isErrorLane_BodyTemplate = (rowData) => {
        return (
            <>
                { (rowData.is_ErrorLane == 1)?<Badge value="Yes" severity="danger"></Badge> : <Badge value="No" severity="success"></Badge> }
            </>
        );
    };
    const is_noread_BodyTemplate = (rowData) => {
        return (
            <>
                { (rowData.is_noread == 1)?<Badge value="Yes" severity="danger"></Badge> : <Badge value="No" severity="success"></Badge> }
            </>
        );
    };
    const lane_type_BodyTemplate = (rowData) => {
        return (
            <>
                { (rowData.lane_type == 2)?<Badge value="Shipping" severity="primary"></Badge> : <Badge value="Receiving" severity="success"></Badge> }
            </>
        );
    };
    
    const header = (
        <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
            <span className="block mt-2 md:mt-0 p-input-icon-left">
                <i className="pi pi-search" />
                {hasActionAccess(PAGE_KEY, "add_lane") &&(<Button label="Add Lanes" icon="pi pi-plus" severity="sucess" onClick={() => navigate("/conveyor/conveyor-lanes/add")} />)}
            </span>
        </div>
    );

    return (
        <>
        <Helmet>
            <title>Conveyor Lanes</title>
        </Helmet>
        <Toast ref={toast} />
        <BreadCrumb model={items} home={home} />
        
        <h1></h1>
        <div className="card">
            <h3>Conveyor Lanes</h3>
            <DataTable 
                value={lanes} 
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
                selection={selectedLanes} 
                onSelectionChange={onSelectionChange} 
                selectAll={selectAll} 
                onSelectAllChange={onSelectAllChange}
                header={header}
                scrollable 
                scrollHeight="600px"
            >
                <Column selectionMode="multiple" headerStyle={{ width: '3rem' }} />
           
                <Column field="title" header="Title" body={titleBodyTemplate} filterMenuStyle={{ width: '14rem' }} showFilterMenu={false} sortable filter filterPlaceholder="Search" />
                <Column field="conveyor_name" sortable header="Conveyor Name" body={nameBodyTemplate} showFilterMenu={false} filter filterPlaceholder="Search" />
                <Column field="conveyor_id" sortable header="Conveyor ID"  body={(data) => data.conveyor_id} showFilterMenu={false} filter filterPlaceholder="Search" />
                <Column field="lane_type" sortable header="Lane Type"  body={lane_type_BodyTemplate} showFilterMenu={false} filter filterPlaceholder="Search" />
                <Column field="is_noread"  header="Is No Read" body={is_noread_BodyTemplate}  />
                <Column field="Is_ErroLane"  header="Error Lane" body={isErrorLane_BodyTemplate}  />
                
            </DataTable>
        </div>
        </>
        
    );
}
        