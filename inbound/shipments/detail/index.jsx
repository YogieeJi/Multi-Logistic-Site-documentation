
import React, { useState, useEffect, useRef } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { ShipmentsService } from '../../../../service/inbound/ShipmentService';
import { Link, useParams,useNavigate } from 'react-router-dom';
import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';
import { Sidebar } from 'primereact/sidebar';
import { Timeline } from 'primereact/timeline';
import { Card } from 'primereact/card';
import { Toast } from 'primereact/toast';
import { GeneralService } from '../../../../service/inbound/GeneralService';
import { Dialog } from 'primereact/dialog';
import { Badge } from 'primereact/badge';
import { Menu } from 'primereact/menu';
import { InputText } from 'primereact/inputtext';
import { ProgressSpinner } from 'primereact/progressspinner';
import { useLazySort } from '../../../../components/useLazySort';
import { TabView, TabPanel } from 'primereact/tabview';
import { useAuth } from '../../../../store/useAuth';


export default function ShipmentDetails() {
    const [loading, setLoading] = useState(false);
    const { hasActionAccess } = useAuth();
        const PAGE_KEY = "Shipment_Details";
    const [formLoader, setFormLoader] = useState(false);
    const [isConveyableitemAttribute, setIsConveyableitemAttribute] = useState(2);
    const [error, setError] = useState(false);
    const [errorLogs, setErrorLogs] = useState(null);

    const [totalRecords, setTotalRecords] = useState(0);
    const [shipments, setShipments] = useState(null);
    const [shipmentDetail, setShipmentDetail] = useState({
        'created_at': '-',
        'fcy': '-'
    });
    const [btnDisabled, setbtnDisabled] = useState(false);
    const toast = useRef();
    const menuLeft = useRef(null);
    const [shipmentLines, setShipmentLines] = useState(null);
    const [selectAll, setSelectAll] = useState(false);
    const [selectedShipments, setSelectedShipments] = useState(null);

    const [revalidateBtnDisabled, setrevalidateBtnDisabled] = useState(true);
    const [conveyableBtnDisabled, setconveyableBtnDisabled] = useState(true);
    const [displayConfirmation, setDisplayConfirmation] = useState(false);
    const [displayConfirmation1, setDisplayConfirmation1] = useState(false);
    const [displayConfirmation2, setDisplayConfirmation2] = useState(false);

    const [statusValue, setStatusValue] = useState(null);

    const [dates, setDates] = useState(null);
    const [visibleRight, setVisibleRight] = useState(false);
    const [lazyState, setlazyState] = useState({
        first: 0,
        rows: 25,
        page: 1,
        sortField: null,
        sortOrder: null,
        filters: {
            pohnum: { value: '', matchMode: 'contains' },
            ship_num: { value: '', matchMode: 'contains' },
            ship_dat: { value: '', matchMode: 'contains' },
            poplin: { value: '', matchMode: 'contains' },
            create_dat_tim: { value: '', matchMode: 'contains' },
            fcy: { value: '', matchMode: 'contains' },
            bpsnum: { value: '', matchMode: 'contains' },
            expected_at: { value: '', matchMode: 'contains' },
            is_sync: { value: '', matchMode: 'contains' },
            synced_at: { value: '', matchMode: 'contains' },
            itmref: { value: '', matchMode: 'contains' },
            uom: { value: '', matchMode: 'contains' },
            pohfcy: { value: '', matchMode: 'contains' },
            input_itmref: { value: '', matchMode: 'contains' },
            input_uom: { value: '', matchMode: 'contains' },
            extrcpdat: { value: '', matchMode: 'contains' },
            shiqty: { value: '', matchMode: 'contains' },
            input_qty: { value: '', matchMode: 'contains' },
            qtyweu: { value: '', matchMode: 'contains' },
            qtyvou: { value: '', matchMode: 'contains' },
        }
    });

    const { onSort } = useLazySort(setlazyState);
    const navigate = useNavigate();

    const [logs, setLogs] = useState(null);
    const [visible, setVisible] = useState(false);
    const [dialogText, setDialogText] = useState('');

    const getSeverity = (status) => {
        switch (status) {
            case 1:
                return 'info';

            case 2:
                return 'warning';

            case 3:
                return 'success';
        }
    };

    const reactRouterLink = (label, url) => {
        return (<Link to={url}>{label}</Link>);
    }

    const items = [{ label: 'Inbound' }, { template: reactRouterLink('Shipments', '/inbound/shipments') }];
    const home = { icon: 'pi pi-home', url: '/' }

    let networkTimeout = null;
    const params = useParams();

    const logTopics = useState({
        moduleId: 1,
        subModuleId: 1,
        subjectId: params.id
    });

    useEffect(() => {
        loadLazyData();
    }, [lazyState]);

    const [eaches, seteaches] = useState('');
    const [noLayers, setnoLayers] = useState('');
    const [isconeyableDropdown, setIsconeyableDropdown] = useState("0");

    const loadLazyData = () => {
        ShipmentsService.getShipmentDetail(params.id).then((data) => {
            setShipmentDetail(data.data[0]);
            if (data.data[0].invalid_items == '1') {
                setrevalidateBtnDisabled(false);
            }
            if (data.data[0].is_conveyable == '0') {
                setconveyableBtnDisabled(false);
            }

        });
        if (shipmentDetail.status === 1) {
            setStatusValue('Pending');
        } else if (shipmentDetail.status === 2) {
            setStatusValue('Processing');
        } else {
            setStatusValue('Completed');
        }
        setLoading(true);


        if (networkTimeout) {
            clearTimeout(networkTimeout);
        }

        //imitate delay of a backend call
        networkTimeout = setTimeout(() => {
            ShipmentsService.getShipmentLines(params.id, (lazyState)).then((data) => {
                setTotalRecords(data.totalRecords);
                setShipmentLines(data.data);
                setLoading(false);
            });
        }, Math.random() * 100 + 250);

        // GeneralService.getLogs(logTopics[0]).then((data) => {
        //     setLogs(data.data);
        // });
        const filtererrorlogs = [];
        GeneralService.getLogs(logTopics[0]).then((data) => {
            setLogs(data.data);
            if ((data.data).length > 0) {
                data.data.map((a) => {
                    if (a.event == 'error') filtererrorlogs.push(a);

                });
                setErrorLogs(filtererrorlogs);
            }
        });


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

        setSelectedShipments(value);
        setSelectAll(value.length === totalRecords);
    };

    const onSelectAllChange = (event) => {
        const selectAll = event.checked;

        if (selectAll) {
            ShipmentsService.getShipmentLines(params.id).then((data) => {
                setSelectAll(true);
                setSelectedShipments(data.shipments);
            });
        } else {
            setSelectAll(false);
            setSelectedShipments([]);
        }
    };

    const pohnumBodyTemplate = (rowData) => {
        return (
            <>
                {rowData.pohnum}
            </>
        );
    };

    const poplinBodyTemplate = (rowData) => {
        return (
            <>
                {rowData.poplin}
            </>
        );
    };

    const poqseqdDateBodyTemplate = (rowData) => {
        return (
            <>
                {rowData.poqseq}
            </>
        );
    };
    const exportExcel = () => {
        import('xlsx').then((xlsx) => {
            const worksheet = xlsx.utils.json_to_sheet(shipmentLines); // Convert shipmentLines to a worksheet
            const workbook = { Sheets: { data: worksheet }, SheetNames: ['data'] }; // Create a workbook
            const excelBuffer = xlsx.write(workbook, {
                bookType: 'xlsx',
                type: 'array'
            });

            saveAsExcelFile(excelBuffer, 'shipmentDetail_' + shipmentDetail.ship_uid); // Save the file
        });
    };

    const saveAsExcelFile = (buffer, fileName) => {
        import('file-saver').then((module) => {
            if (module && module.default) {
                let EXCEL_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';
                let EXCEL_EXTENSION = '.xlsx';
                const data = new Blob([buffer], {
                    type: EXCEL_TYPE
                });

                module.default.saveAs(data, fileName + '_export_' + new Date().getTime() + EXCEL_EXTENSION); // Save the file
            }
        });
    };
    const ctrnumBodyTemplate = (rowData) => {
        return (
            <>
                {rowData.ctrnum}
            </>
        );
    };

    const ctrlinBodyTemplate = (rowData) => {
        return (
            <>
                {rowData.ctrlin}
            </>
        );
    };

    const shiqtyBodyTemplate = (rowData) => {
        return (
            <>
                {rowData.shiqty}
            </>
        );
    };
    const inputQtyBodyTemplate = (rowData) => {
        return (
            <>
                {rowData.input_qty}
            </>
        );
    };

    const extrcpdatBodyTemplate = (rowData) => {
        if (!rowData.extrcpdat) return '';
        const date = new Date(rowData.extrcpdat);
        const dateOnly = date.toLocaleDateString('en-CA');
        return <>{dateOnly}</>;
    };


    const qtyweuBodyTemplate = (rowData) => {
        return (
            <>
                {rowData.qtyweu ?? '-'}
            </>
        );
    };

    const qtyvouBodyTemplate = (rowData) => {
        return (
            <>
                {rowData.qtyvou ?? '-'}
            </>
        );
    };



    const itmrefBodyTemplate = (rowData) => {
        return (
            <>
                {(rowData.itmref)}
            </>
        );
    };

    const uomBodyTemplate = (rowData) => {
        return (
            <>
                {rowData.uom ?? '-'}
            </>
        );
    };

    const pohfcyBodyTemplate = (rowData) => {
        return (
            <>
                {rowData.pohfcy ?? '-'}
            </>
        );
    };

    const input_itmrefBodyTemplate = (rowData) => {
        return (
            <>
                {(rowData.input_itmref)}
            </>
        );
    };

    const input_uomBodyTemplate = (rowData) => {
        return (
            <>
                {rowData.input_uom ?? '-'}
            </>
        );
    };
    const input_shiplinBodyTemplate = (rowData) => {
        return (
            <>
                {rowData.shiplin ?? '-'}
            </>
        );
    };
    const invalid_itemBodyTemplate = (rowData) => {
        return (
            <>
                {(rowData.invalid_items == 1) ? <Badge value="Yes" severity="danger"></Badge> : <Badge value="No" severity="success"></Badge>}
            </>
        );
    };
    const isConveyableBodyTemplate = (rowData) => {
        return (
            <>
                {(rowData.is_conveyable == 0) ? <Badge value="No" severity="danger"></Badge> : <Badge value="Yes" severity="success"></Badge>}
            </>
        );
    };

    const is_present_in_mantisBodyTemplate = (rowData) => {
        const value = String(rowData.is_present_in_mantis).toLowerCase() === "true";
        return (
            <>
                {value
                    ? <Badge value="Yes" severity="success"></Badge>
                    : <Badge value="No" severity="danger"></Badge>}
            </>
        );
    };

    const syncDetails = () => {
        // dt.current.exportCSV();
        console.log(selectedShipments);
    };
    const actionItems = [
        hasActionAccess(PAGE_KEY, "add_attributes") &&{
            label: 'Add Attributes',
            icon: 'pi pi-plus',
            command: () => {
                if (selectedShipments != null && selectedShipments.length > 0) {
                    if (selectedShipments.length > 1) {
                        toast.current.show({ severity: 'error', summary: 'Error', detail: 'Kindly select one shipment' });
                    } else {


                        displayAttributesForm();


                    }


                } else {
                    toast.current.show({ severity: 'error', summary: 'Error', detail: 'Kindly select atleast one shipment' });
                }
            }
        },

    ].filter(Boolean);
    const downloadPDF = async () => {
        try {
            setLoading(true);

            // Fetch PDF as blob using params.id
            const { blob, receiptCode } = await ShipmentsService.getshipmentlinesPDF(params.id);

            // Create a URL for the blob
            const url = window.URL.createObjectURL(blob);

            // Construct the filename dynamically
            const now = new Date();
            const formattedDate = now.toISOString().split('T')[0]; // "YYYY-MM-DD"

            const identifier = receiptCode || params.id; // skip if both undefined/null
            const filename = `Shipment_Report${identifier ? `_${identifier}` : ''}_${formattedDate}.pdf`;


            // Create an anchor element and trigger download
            const a = document.createElement("a");
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);

            // Revoke the object URL to free memory
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error("Error downloading PDF:", error);
        } finally {
            setLoading(false); // Ensure loading is set to false after completion
        }
    };
    const displayAttributesForm = () => {
        setFormLoader(true);
        setDisplayConfirmation2(true)
        ShipmentsService.getItemAttributes(selectedShipments[0].itmref).then((data) => {

            if (data.error == 0) {
                data = data.data;

                if ("7" in data) setnoLayers(data["7"])
                if ("8" in data) seteaches(data["8"])
                setIsConveyableitemAttribute(data["9"]);

            } else {
                toast.current.show({ severity: 'error', summary: 'Error Message', detail: data.message, life: 3000 });
            }
        })
            .finally(() => setFormLoader(false));
    }
    const header = (
        <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
            <span className="block mt-2 md:mt-0 p-input-icon-left">
                <i className="pi pi-search" />
                <Menu model={actionItems} popup ref={menuLeft} id="popup_menu_left" />
                {actionItems.length > 0 && (<Button label="Actions" icon="pi pi-align-left" className="mr-2" onClick={(event) => menuLeft.current.toggle(event)} aria-controls="popup_menu_left" aria-haspopup />)}
            </span>
            <div className="flex gap-2">
                <span className="p-input-icon-left">
                    <Button type="button" icon="pi pi-file-excel" severity="success" rounded onClick={exportExcel} data-pr-tooltip="XLS" />
                </span>
                <span className="p-input-icon-left">
                    {hasActionAccess(PAGE_KEY, "download_pdf") &&(<Button label="Download PDF" icon="pi pi-file-pdf" severity="danger" onClick={downloadPDF} />)}
                </span>
            </div>
        </div>
    );

    const confirmationDialogFooter = (
        <>
            <Button type="button" label="No" icon="pi pi-times" onClick={() => setDisplayConfirmation(false)} className="p-button-text" />
            <Button type="button" label="Yes" icon="pi pi-check" onClick={() => reValidateItems()} className="p-button-text" autoFocus />
        </>
    );
    const confirmationDialogFooter1 = (
        <>
            <Button type="button" label="No" icon="pi pi-times" onClick={() => setDisplayConfirmation1(false)} className="p-button-text" />
            <Button type="button" label="Yes" icon="pi pi-check" onClick={() => reConveyableItems()} className="p-button-text" autoFocus />
        </>
    );
    const confirmationDialogFooter2 = (
        <>
            <Button type="button" label="Cancel" icon="pi pi-times" disabled={btnDisabled} onClick={() => setDisplayConfirmation2(false)} severity="secondary" />
            <Button type="button" label="Submit" icon="pi pi-check" disabled={btnDisabled} onClick={() => addAttributes()} severity="success" autoFocus />
        </>
    );
    const reConveyableItems = () => {
        setDisplayConfirmation1(false)

        ShipmentsService.reValidateConveyAbleItems(params.id).then((data) => {
            setLoading(false);
            if (data.error == 0) {
                loadLazyData();
            } else {
                toast.current.show({ severity: 'error', summary: 'Error Message', detail: data.message, life: 3000 });
            }
        });
    }
    const reValidateItems = () => {
        setDisplayConfirmation(false)
        setLoading(true);
        ShipmentsService.reValidateItems(params.id).then((data) => {
            setLoading(false);
            if (data.error == 0) {
                loadLazyData();
                // setSelectAll(false);
                // setSelectedDelivery([]);
                // toast.current.show({ severity: 'success', summary: 'Success Message', detail: data.message, life: 3000 });
            } else {
                // toast.current.show({ severity: 'error', summary: 'Error Message', detail: data.message, life: 3000 });
            }
        });
    }

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
        }
        else if (event === 'error') {
            // Display error message
            text += '<h5>Exception</h5>';
            text += item?.error || 'No error data';
        }

        setDialogText(text);
    };





    const customizedContent = (item) => {
        let causerName = item.causer_id ? item.causer_name : 'System';
        let date = new Date(item.created_at);
        return (
            <div className='timeline_content'>
                <div className='main_line'>
                    <p><span style={{ fontWeight: 'bold' }}>{date.getFullYear() + '-' + date.getMonth() + '-' + date.getDate() + ' ' + date.getHours() + ':' + date.getMinutes() + ':' + date.getSeconds()}</span> - {item.description}...</p>
                    <a href='' onClick={(e) => readMorePopup(e, item.properties, item.event)}>read more</a>

                </div>
                <div className='secondary_line'>
                    <p>By <span style={{ fontWeight: 'bold' }}>{causerName}</span></p>
                    <Button label={item.event.toUpperCase()} className={item.event == 'created' ? 'status_btn  btn_success' : (item.event == 'error') ? 'status_btn  btn_danger' : 'status_btn  btn_info'}></Button>
                </div>

            </div>
        );
    };
    const addAttributes = () => {

        if (eaches.length == 0 && noLayers.length == 0 && isconeyableDropdown == 0) {

            setError(true);
            return false;
        }

        setError(false);
        setbtnDisabled(true);
        setFormLoader(true);
        const data = {
            "item_id": selectedShipments[0].itmref,
            "eaches": eaches,
            "layers": noLayers,
            "conveyable": isconeyableDropdown
        }

        ShipmentsService.updateItemAttributes(data).then((data) => {
            if (data.error == 0) {
                setDisplayConfirmation2(false);
                setFormLoader(false);
                seteaches('')
                setnoLayers('')
                setIsconeyableDropdown(0)
                setbtnDisabled(false);
                setIsConveyableitemAttribute(2);
                setSelectedShipments(null)
                toast.current.show({ severity: 'success', summary: 'Success Message', detail: data.message, life: 3000 });
            } else {
                toast.current.show({ severity: 'error', summary: 'Error Message', detail: data.message, life: 3000 });
            }
        });

    };


    return (
        <>
            <Toast ref={toast} />
            <Button
                        label="Back"
                        icon="pi pi-arrow-left"
                        className="p-button-primary"
                        onClick={() => navigate("/inbound/shipments")} 
                        style={{ margin: '10px 0' }}
                    />
            {/* <BreadCrumb model={items} home={home} /> */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3>Container ID {shipmentDetail?.ship_uid}</h3>
                <div className='page-headerActions' style={{ display: "flex", gap: 30, alignItems: 'center' }}>
                    <span onClick={() => setVisibleRight(true)} style={{ cursor: 'pointer', fontWeight: 500, fontSize: '18px', lineHeight: '21px', color: '#222222' }}><i className='pi pi-list' style={{ fontWeight: '600', fontSize: '20px' }}></i><span className='p-badge p-component p-badge-no-gutter p-badge-danger'></span>View Logs</span>
                    {/* <span style={{ fontWeight: 500, fontSize: '18px', lineHeight: '21px', color: '#222222' }}><i className='pi m-left' style={{ fontWeight: '500', fontSize: '20px' }}></i> Back</span> */}
                </div>
            </div>
            <h1></h1>

            <Sidebar className='logs_sidebar' visible={visibleRight} onHide={() => setVisibleRight(false)} baseZIndex={1000} position="right">
                <div className='side_barHeader mt-4'>
                    <div className='left_centent'>Logs</div>
                    {/* <div className='right_centent'><i className='pi m-check-circle mr-1'></i>Mark all as read</div> */}
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


            <Dialog header="Confirmation" visible={displayConfirmation} onHide={() => setDisplayConfirmation(false)} style={{ width: '350px' }} modal footer={confirmationDialogFooter}>
                <div className="flex align-items-center justify-content-center">
                    <i className="pi pi-exclamation-triangle mr-3" style={{ fontSize: '2rem' }} />
                    <span>Are you sure you want to proceed?</span>
                </div>
            </Dialog>
            <Dialog header="Confirmation" visible={displayConfirmation1} onHide={() => setDisplayConfirmation1(false)} style={{ width: '350px' }} modal footer={confirmationDialogFooter1}>
                <div className="flex align-items-center justify-content-center">
                    <i className="pi pi-exclamation-triangle mr-3" style={{ fontSize: '2rem' }} />
                    <span>Are you sure you want to proceed?</span>
                </div>
            </Dialog>
            <Dialog header="Log Detail" visible={visible} style={{ width: '50vw' }} onHide={() => setVisible(false)}>
                <p className="m-0" dangerouslySetInnerHTML={{ __html: dialogText }}>
                </p>
            </Dialog>
            <Dialog header="Add Item Attributes" visible={displayConfirmation2} onHide={() => setDisplayConfirmation2(false)} style={{ width: '400px' }} modal footer={confirmationDialogFooter2}>
                {(formLoader) ? (
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                        <ProgressSpinner />
                    </div>
                ) : (<>
                    <div className="p-field mt-3  block ">
                        <label htmlFor="eaches" className="block">No. of Eaches</label>
                        <InputText
                            id="eaches"
                            value={eaches}
                            onChange={(e) => seteaches(e.target.value)}
                            className="w-full"
                        />

                    </div>
                    <div className="p-field mt-3 block ">
                        <label htmlFor="noLayers" className="block">No. of Layers</label>
                        <InputText
                            id="noLayers"
                            value={noLayers}
                            onChange={(e) => setnoLayers(e.target.value)}
                            className="w-full"
                        />
                    </div>
                    <div className="p-field mt-3 block ">
                        <label htmlFor="noLayers" className="block">Is Conveyable?</label>
                        <select className="w-full md:w-10rem select-box-min" onChange={(event) => {
                            setIsconeyableDropdown(event.target.value);
                        }}>

                            <option key="0" value="0"  >select</option>
                            <option key="1" value="1" selected={isConveyableitemAttribute == 0} >No</option>
                            <option key="2" value="2" selected={isConveyableitemAttribute == 1}>Yes</option>

                        </select>

                    </div>

                    {(error) ?
                        (
                            <small className="flex align-items-center justify-content-center mt-4 ">
                                <p style={{ color: 'red' }}>The form cannot be submitted when it's empty.</p>
                            </small>
                        )
                        : ''
                    }
                </>)}
            </Dialog>
            <div className="card">
                {/* <h3>Shipment</h3> */}
                <h1></h1>
                <div className="p-fluid formgrid grid">
                    <div className="field col-12 md:col-4">
                        <h5 id="created_at">Created At</h5>
                        <p htmlFor="created_at">{shipmentDetail.created_at}</p>

                    </div>
                    <div className="field col-12 md:col-4">
                        <h5 id="warehouse">Warehouse</h5>
                        <p htmlFor="warehouse">{shipmentDetail.fcy}</p>

                    </div>
                    {/* <div className="field col-12 md:col-4">
                        <h5 id="status">Status</h5>
                        <Tag value={statusValue} severity={getSeverity(shipmentDetail.status)} />

                    </div> */}
                </div>
            </div>
            <div className="card">

                <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
                    <span className="block mt-2 md:mt-0 p-input-icon-left">
                        <h3>Shipment Lines</h3>
                    </span>
                    <span className="flex mt-2 md:mt-0 p-input-icon-left gap-2">
                        {hasActionAccess(PAGE_KEY, "conveyable_items") &&(<Button label="Conveyable Items" disabled={conveyableBtnDisabled} icon="pi pi-check" severity="secondary" onClick={() => setDisplayConfirmation1(true)} />)}
                        {hasActionAccess(PAGE_KEY, "re_validate_items") &&(<Button label="Re-Validate Items" icon="pi pi-check" severity="secondary" onClick={() => setDisplayConfirmation(true)} />)}
                    </span>
                </div>
                <h1></h1>
                <DataTable
                    value={shipmentLines}
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
                    header={header}
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
                    emptyMessage="No shipments found."
                    selection={selectedShipments}
                    onSelectionChange={onSelectionChange}
                    selectAll={selectAll}
                    onSelectAllChange={onSelectAllChange}
                    scrollable
                    scrollHeight="600px"

                >
                    <Column selectionMode="multiple" headerStyle={{ width: '3rem' }} />

                    <Column field="pohnum" header="Order #" body={pohnumBodyTemplate} filterMenuStyle={{ width: '14rem' }} showFilterMenu={false} sortable filter filterPlaceholder="Search" />
                    <Column field="poplin" sortable header="Order Line" body={poplinBodyTemplate} showFilterMenu={false} filter filterPlaceholder="Search" />
                    {/* <Column field="poqseq" sortable filter header="Order Seq" body={poqseqdDateBodyTemplate} showFilterMenu={false} filterPlaceholder="Search" /> */}
                    {/* <Column field="ctrnum" header="Container #" body={ctrnumBodyTemplate} sortable showFilterMenu={false} filter filterPlaceholder="Search" />
                    <Column field="ctrlin" header="Container Line" body={ctrlinBodyTemplate} showFilterMenu={false} sortable filter filterPlaceholder="Search" /> */}
                    <Column field="itmref" sortable filter header="Item Reference" body={itmrefBodyTemplate} showFilterMenu={false} filterPlaceholder="Search" />
                    <Column field="uom" header="Uom" body={uomBodyTemplate} showFilterMenu={false} filter filterPlaceholder="Search" />
                    <Column field="pohfcy" header="Pohfcy" body={pohfcyBodyTemplate} showFilterMenu={false} filter filterPlaceholder="Search" />
                    <Column field="extrcpdat" sortable filter header="Expected At" body={extrcpdatBodyTemplate} showFilterMenu={false} filterPlaceholder="Search" />
                    <Column field="shiqty" sortable header="Ship Qty" body={shiqtyBodyTemplate} showFilterMenu={false} filter filterPlaceholder="Search" />
                    <Column field="input_qty" sortable header="Input Qty" body={inputQtyBodyTemplate} showFilterMenu={false} filter filterPlaceholder="Search" />
                    <Column field="qtyweu" header="Weight" body={qtyweuBodyTemplate} showFilterMenu={false} filter filterPlaceholder="Search" />
                    <Column field="qtyvou" header="Volume" body={qtyvouBodyTemplate} showFilterMenu={false} filter filterPlaceholder="Search" />
                    <Column field="input_itmref" sortable filter header="Input Item Ref" body={input_itmrefBodyTemplate} showFilterMenu={false} filterPlaceholder="Search" />
                    <Column field="input_uom" header="Input Uom" body={input_uomBodyTemplate} showFilterMenu={false} filter filterPlaceholder="Search" />
                    <Column field="shiplin" header="Ship Line" body={input_shiplinBodyTemplate} />
                    <Column field="invalid_items" header="Invalid Item" body={invalid_itemBodyTemplate} />
                    <Column field="is_conveyable" header="Conveyable" body={isConveyableBodyTemplate} />
                    <Column field="is_present_in_mantis" header="Present in mantis" body={is_present_in_mantisBodyTemplate} />


                </DataTable>
            </div>
        </>

    );
}
