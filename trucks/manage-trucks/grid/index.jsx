
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
import { ItemConversionService } from '../../../../service/setups/ItemConversionService';
import { Badge } from 'primereact/badge';
import { Dialog } from 'primereact/dialog';
import { FileUpload } from 'primereact/fileupload';
import { ManageTrucksService } from '../../../../service/setups/ManageTrucksService';
import { Dropdown } from 'primereact/dropdown';
import { set } from 'react-hook-form';
import { setsEqual } from 'chart.js/helpers';
import { useLazySort } from '../../../../components/useLazySort';
import { useAuth } from '../../../../store/useAuth';


export default function ItemConversion() {
    const { hasActionAccess } = useAuth();
    const PAGE_KEY = "manage_trucks";
    const [showbutton, setShowbutton] = useState(false);
    const [buttonLabel, setButtonLabel] = useState(null);
    const [buttonStatus, setButtonStatus] = useState(null);
    const [loading, setLoading] = useState(false);
    const [totalRecords, setTotalRecords] = useState(0);
    const [trucks, setTrucks] = useState(null);
    const [selectAll, setSelectAll] = useState(false);
    const [selectedTrucks, setSelectedTrcuks] = useState(null);
    const [displayConfirmation, setDisplayConfirmation] = useState(false);

    const [displayConfirmation1, setDisplayConfirmation1] = useState(false);
    const [btnDisabled, setbtnDisabled] = useState(false);

    const toast = useRef();
    let fileRef = useRef();
    const [templateUrl, setTemplateUrl] = useState(false);
    const navigate = useNavigate();
    const [lazyState, setlazyState] = useState({
        first: 0,
        rows: 25,
        page: 1,
        sortField: "",
        sortOrder: "",
        filters: {
            trk_Code: { value: null, matchMode: 'contains' },
            trk_Plate: { value: null, matchMode: 'contains' },
            truckStatus: { value: null, matchMode: 'contains' },
        }
    });

    const { onSort } = useLazySort(setlazyState);
    const [removeItemData, setRemoveItemData] = useState({
        Sku: '',
    })

    const formMessageDetail = useSelector((state) => state.formMessage.detail)
    const formMessageSeverity = useSelector((state) => state.formMessage.severity)
    const formMessageSummary = useSelector((state) => state.formMessage.summary)

    const dispatch = useDispatch()


    const items = [{ label: 'Manage Trucks' }, { label: 'List' }];
    const home = { icon: 'pi pi-home', url: '/' }

    let networkTimeout = null;

    useEffect(() => {
        if (formMessageDetail != '') {
            toast.current.show({ severity: formMessageSeverity, summary: formMessageSummary, detail: formMessageDetail });
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
            ManageTrucksService.getTrucksGrid((lazyState)).then((data) => {
                setTotalRecords(data.totalRecords);
                setTrucks(data.data);
                setTemplateUrl(data.template_url)
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

        setSelectedTrcuks(value);
        setSelectAll(value.length === totalRecords);
        getCheckInOutButtonLabel(value);

    };

    const onSelectAllChange = (event) => {
        const selectAll = event.checked;

        if (selectAll) {
            setSelectAll(true);
            setSelectedTrcuks(trucks);
        } else {
            setSelectAll(false);
            setSelectedTrcuks([]);
        }
    };

    const codeBodyTemplate = (rowData) => {
        return (
            <>{rowData.trk_Code}</>
        );
    };

    const plateNumberBodyTemplate = (rowData) => {
        return (
            <>{rowData.trk_Plate}</>
        );
    };
    const statusBodyTemplate = (rowData) => {
        return (
            <>
                {(rowData.truckStatus == 'New') ? <Badge value="New" severity="info"></Badge> : (rowData.truckStatus == 'Check-In') ? <Badge value="Checked In" severity="success"></Badge> : (rowData.truckStatus == 'Check-Out') ? <Badge value="Checked Out" severity="danger"></Badge> : '--'}
            </>
        );
    };
    const globalFlags = [
        { code: '1', name: 'New' },
        { code: '2', name: 'Checked In' },
        { code: '3', name: 'Checked Out' },
    ];
    const globalRowFilterTemplate = (options) => {
        return (
            <Dropdown style={{ minWidth: '13em', width: '13em' }} value={options.value}
                optionValue="code" optionLabel="name" options={globalFlags}
                onChange={(e) => options.filterApplyCallback(e.value)}
                itemTemplate={flagTemplate} placeholder="Select" className="p-column-filter" showClear />
        );
    };
    const flagTemplate = (option) => {
        return <Badge value={option.name} severity={getSeverity(option.name)} />;
    };
    const getSeverity = (flag) => {
        switch (flag) {
            case 'New':
                return 'info';
            case 'Checked In':
                return 'success';
            case 'Checked Out':
                return 'danger';
        }
    };

    const getCheckInOutButtonLabel = (value) => {
        if (value.length >= 1) {
            const selectedStatus = value[0].truckStatus;
            setShowbutton(true);
            if (selectedStatus == 1) {
                setButtonLabel("Checked In");
                setButtonStatus(2);
                // console.log(buttonLabel);
            } else if (selectedStatus == 2) {
                setButtonLabel("Checked Out");
                setButtonStatus(3);
            } else {
                setButtonLabel(null);
                setButtonStatus(null);
            }
            // console.log(selectedStatus);

        } else {
            setButtonLabel(null);
            setShowbutton(false);
        }
    };

    const handleCheckInOut = async () => {

        const data = {
            truckStatus: buttonStatus,
            trucks: selectedTrucks
        }

        setLoading(true); // Start loading
        ManageTrucksService.updateStatus((data)).then((data) => {

            if (data.error == 0) {
                setSelectedTrcuks(null);
                setButtonLabel(null);
                setShowbutton(false);
                setButtonStatus(null)
                toast.current.show({ severity: 'success', summary: 'Truck Status', detail: data.message });

                loadLazyData();
            }
            else {
                toast.current.show({ severity: 'error', summary: 'Error encountered', detail: data.message });
            }
            setLoading(false);
        });

    };
    const header = (
        <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
            <span className="block mt-2 md:mt-0 p-input-icon-left">
                {hasActionAccess(PAGE_KEY, "add_trucks") && (<><i className="pi pi-search" />
                <Button label="Add Trucks" icon="pi pi-plus" severity="sucess" onClick={() => navigate("/trucks/add")} /> </>)}
            </span>
            {/* <span className="block mt-2 md:mt-0 p-input-icon-left">
                <Button label="Upload" icon="pi pi-upload" severity="secondary" onClick={() => setDisplayConfirmation(true)} />
            </span> */}
            <span className="block mt-2 md:mt-0 p-input-icon-left">
                {showbutton ? (
                    <Button
                        label={buttonLabel}
                        icon={buttonLabel === "Check In" ? "pi pi-sign-in" : "pi pi-sign-out"}
                        severity="sucess"
                        onClick={handleCheckInOut} // Ensure handleCheckInOut is defined and handles the button click
                    />
                ) : null}
            </span>

        </div>
    );


    const fileUploadHandler = ({ files }) => {
        const [file] = files;
        uploadFile(file);
    };

    const uploadFile = async (inputFile) => {
        let formData = new FormData();
        formData.append('inputFile', inputFile);
        ItemConversionService.uploadItems(formData).then((data) => {
            if (data.error == 0) {
                fileRef.clear();
                toast.current.show({ severity: 'success', summary: 'File Upload', detail: data.message });

                setLoading(true);
                ItemConversionService.getItemsGrid((lazyState)).then((data) => {
                    setTotalRecords(data.totalRecords);
                    setTrucks(data.data);
                    setLoading(false);
                });

                setDisplayConfirmation(false);

            } else {
                toast.current.show({ severity: 'error', summary: 'File Upload', detail: data.message, sticky: true });
                networkTimeout = setTimeout(() => {
                    toast.current.clear();
                }, 3000);
            }

        });
    };

    const removeItemsPopup = (id) => {
        setRemoveItemData({
            id
        })
        setDisplayConfirmation1(true)
    }

    const removeItem = () => {
        setbtnDisabled(true);

        ItemConversionService.deleteItem(removeItemData).then((data) => {
            setLoading(false);
            if (data.error == 0) {
                toast.current.show({ severity: 'success', summary: 'Success Message', detail: data.message, life: 3000 });
            } else {
                toast.current.show({ severity: 'error', summary: 'Error Message', detail: data.message, life: 3000 });
            }
            // loadGrid({});
            setDisplayConfirmation1(false)
            setbtnDisabled(false);
            loadLazyData();
        });

    }

    const confirmationDialogFooter = (
        <>

            <Button type="button" label="Close" icon="pi pi-times" onClick={() => setDisplayConfirmation(false)} className="p-button-text" />
        </>
    );
    const confirmationDialogFooter1 = (
        <>
            <Button type="button" disabled={btnDisabled} label="No" icon="pi pi-times" onClick={() => setDisplayConfirmation1(false)} className="p-button-text" />
            <Button type="button" disabled={btnDisabled} label="Yes" icon="pi pi-check" onClick={() => removeItem()} className="p-button-text" autoFocus />
        </>
    );



    return (
        <>
            <Helmet>
                <title>Manage Trucks | Sagis</title>
            </Helmet>
            <Toast ref={toast} />
            <BreadCrumb model={items} home={home} />
            <Dialog header="Upload" visible={displayConfirmation} onHide={() => setDisplayConfirmation(false)} style={{ width: '550px' }} modal footer={confirmationDialogFooter}>
                <Link to={templateUrl} >Download Template</Link>
                <h1></h1>
                <FileUpload name="file[]"
                    ref={(el) => fileRef = el}
                    customUpload={true}
                    uploadHandler={fileUploadHandler}
                    accept=".xls,.csv,.xlsx"
                    maxFileSize={1000000}
                    emptyTemplate={<p className="m-0">Drag and drop file here to upload.</p>}
                />
            </Dialog>
            <Dialog closable={false} header="Confirmation" visible={displayConfirmation1} onHide={() => setDisplayConfirmation1(false)} style={{ width: '350px' }} modal footer={confirmationDialogFooter1}>
                <div className="flex align-items-center justify-content-center">
                    <i className="pi pi-exclamation-triangle mr-3" style={{ fontSize: '2rem' }} />
                    <span>Are you sure you want to remove this item?</span>
                </div>
            </Dialog>
            <h1></h1>
            <div className="card">
                <h3>Manage Trucks</h3>
                <DataTable
                    value={trucks}
                    lazy
                    filterDisplay="row"
                    dataKey="trk_ID"
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
                    selection={selectedTrucks}
                    onSelectionChange={onSelectionChange}
                    selectAll={selectAll}
                    onSelectAllChange={onSelectAllChange}
                    header={header}
                    scrollable
                    scrollHeight="600px"
                >
                    <Column selectionMode="multiple" headerStyle={{ width: '3rem' }} />
                    <Column field="trk_Code" sortable header="Code" body={codeBodyTemplate} showFilterMenu={false} filter filterPlaceholder="Search" />
                    <Column field="trk_Plate" header="Plate Number" body={plateNumberBodyTemplate} filterMenuStyle={{ width: '14rem' }} showFilterMenu={false} sortable filter filterPlaceholder="Search" />
                    <Column field="truckStatus" sortable header="Status" body={statusBodyTemplate} showFilterMenu={false} filter filterElement={globalRowFilterTemplate} />



                </DataTable>
            </div>
        </>

    );
}
