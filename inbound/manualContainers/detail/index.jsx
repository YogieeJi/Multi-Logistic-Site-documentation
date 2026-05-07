
import React, { useState, useEffect, useRef } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Link, useParams } from 'react-router-dom';
import { Button } from 'primereact/button';
import { BreadCrumb } from 'primereact/breadcrumb';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Tag } from 'primereact/tag';
import { ContainersService } from '../../../../service/inbound/ContainerService';
import { Menu } from 'primereact/menu';
import { GeneralService } from '../../../../service/inbound/GeneralService';
import { ShipmentsService } from '../../../../service/inbound/ShipmentService';
import { Dialog } from 'primereact/dialog';
import { Sidebar } from 'primereact/sidebar';
import { Timeline } from 'primereact/timeline';
import { Toast } from 'primereact/toast';
import { Badge } from 'primereact/badge';
import { ManualContainersService } from '../../../../service/inbound/ManualContainerService';
import { InputText } from 'primereact/inputtext';
import { useLazySort } from '../../../../components/useLazySort';
import { useNavigate } from "react-router-dom";
import { useAuth } from '../../../../store/useAuth';


export default function ManualContainerDetails() {
    const {hasActionAccess} = useAuth();
    const PAGE_KEY = "inbound_manual_containers_Details";
   const [loading, setLoading] = useState(false);
    const [totalRecords, setTotalRecords] = useState(0);
    const [container, setContainer] = useState(null);
    const [containerDetail, setContainerDetail] = useState({
        'created_at': '-',
        'fcy': '-'
    });
    const menuLeft = useRef(null);

    const [containerLines, setContainerLines] = useState(null);
    const [selectAll, setSelectAll] = useState(false);
    const [selectedContainers, setSelectedContainers] = useState(null);

    const [statusValue, setStatusValue] = useState(null);
    const [visibleRight, setVisibleRight] = useState(false);

    const [revalidateBtnDisabled, setrevalidateBtnDisabled] = useState(true);
    const [displayConfirmation, setDisplayConfirmation] = useState(false);
    const [displayConfirmation1, setDisplayConfirmation1] = useState(false);
    const [conveyableBtnDisabled, setconveyableBtnDisabled] = useState(true);
    const [dates, setDates] = useState(null);
    const toast = useRef();
    const navigate = useNavigate();
    const [lazyState, setlazyState] = useState({
        first: 0,
        rows: 25,
        page: 1,
        sortField: null,
        sortOrder: null,
        filters: {
            pohnum: { value: '', matchMode: 'contains' },
            poplin: { value: '', matchMode: 'contains' },
            itmref: { value: '', matchMode: 'contains' },
            qtyuom: { value: '', matchMode: 'contains' },
            ctrlin: { value: '', matchMode: 'contains' },
            qtyweu: { value: '', matchMode: 'contains' },
            qtyvou: { value: '', matchMode: 'contains' },
            uom: { value: '', matchMode: 'contains' },
            mantis_imported: { value: '', matchMode: 'contains' },
            is_receipt_complete: { value: '', matchMode: 'contains' },
            is_receipt_sent: { value: '', matchMode: 'contains' },
            receipt_number: { value: '', matchMode: 'contains' },
            status: { value: '', matchMode: 'contains' },
            input_lot_qty: { value: '', matchMode: 'contains' },
            input_sku: { value: '', matchMode: 'contains' },
            input_uom: { value: '', matchMode: 'contains' },
            invalid_item: { value: '', matchMode: 'contains' },
            input_lot: { value: '', matchMode: 'contains' },
        }
    });

    const { onSort } = useLazySort(setlazyState);


    const [logs, setLogs] = useState(null);
    const [visible, setVisible] = useState(false);
    const [dialogText, setDialogText] = useState('');

    const getStatusSeverity = (status) => {
        if (status) {
            if (status.includes('1-')) {
                return 'primary';
            } else if (status.includes('3-')) {
                return 'success';
            } else {
                return 'info';
            }
        }
    };

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

    const items = [{ label: 'Inbound' }, { template: reactRouterLink('Container', '/inbound/containers') }];
    const home = { icon: 'pi pi-home', url: '/' }

    let networkTimeout = null;
    const params = useParams();

    const logTopics = useState({
        moduleId: 1,
        subModuleId: 2,
        subjectId: params.id
    });

    useEffect(() => {
        loadLazyData();
    }, [lazyState]);

    const [btnDisabled, setbtnDisabled] = useState(false);

    const loadLazyData = () => {
        ManualContainersService.getDetail(params.id).then((data) => {
            setContainerDetail(data.data[0]);
            if (data.data[0].contain_invalid_items == 1 || data.data[0].status.toLowerCase().includes('pending')) {
                setrevalidateBtnDisabled(false);
            }
            if (data.data[0].conveyable == 1) {
                setconveyableBtnDisabled(false);
            }
        });
        if (containerDetail.status == 1) {
            setStatusValue('Pending');
        } else if (containerDetail.status == 2) {
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
            ManualContainersService.getLines(params.id, lazyState).then((data) => {
                const updatedData = data.data.map((item, index) => ({
                    ...item,
                    uniqueId: `${item.ctrlin}_${item.itmref}_${item.poplin}_${index}` 
                }));

                setTotalRecords(data.totalRecords);
                setContainerLines(updatedData);
                setLoading(false);
            });
        }, Math.random() * 100 + 250);

        GeneralService.getLogs(logTopics[0]).then((data) => {
            setLogs(data.data);
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
        setSelectedContainers(value);
        setSelectAll(value.length === containerLines.length);
    };

    const onSelectAllChange = (event) => {
        const checked = event.checked;
        setSelectAll(checked);
        setSelectedContainers(checked ? [...containerLines] : []);
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

    const itmrefDateBodyTemplate = (rowData) => {
        return (
            <>
                {rowData.itmref}
            </>
        );
    };

    const qtyuomBodyTemplate = (rowData) => {
        return (
            <>
                {Math.abs(rowData.qtyuom)}
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

    const qtyweuBodyTemplate = (rowData) => {
        return (
            <>
                {rowData.qtyweu}
            </>
        );
    };

    const qtyvouBodyTemplate = (rowData) => {
        return (
            <>
                {(rowData.qtyvou)}
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

    const mantisImportedBodyTemplate = (rowData) => {
        return (
            <>
                {(rowData.mantis_imported == 1) ? <Badge value="Yes" severity="success">N</Badge> : <Badge value="No" severity="danger"></Badge>}
            </>
        );
    };

    const isReceiptCompleteBodyTemplate = (rowData) => {
        return (
            <>
                {(rowData.is_receipt_complete == 1) ? <Badge value="Yes" severity="success">N</Badge> : <Badge value="No" severity="danger"></Badge>}
            </>
        );
    };

    const isReceiptSentBodyTemplate = (rowData) => {
        return (
            <>
                {(rowData.is_receipt_sent == 1) ? <Badge value="Yes" severity="success">N</Badge> : <Badge value="No" severity="danger"></Badge>}
            </>
        );
    };

    const input_skuBodyTemplate = (rowData) => {
        return (
            <>
                {rowData.input_sku ?? '-'}
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
    const input_qtyBodyTemplate = (rowData) => {
        return (
            <>
                {Math.abs(rowData.input_lot_qty || rowData.input_qty)}
            </>
        );
    };

    const exportExcel = () => {
        import("xlsx").then((xlsx) => {

            const headers = [
                "id", "container_id", "ctrnum", "ctruid", "fcy", "bpsnum", "shipnum", "tctrnum",
                "create_dat_tim", "seanum1", "seanum2", "pohnum", "poplin", "poqseq", "itmref",
                "qtyuom", "ctrlin", "extrcpdat", "qtyweu", "qtyvou", "uom", "is_receipt_complete",
                "is_transfer", "is_receipt_sent", "receipt_sent_at", "receipt_number",
                "mantis_imported", "receipt_id", "conveyable", "transfers_id", "status",
                "created_at", "updated_at", "invalid_item", "input_sku", "input_uom",
                "input_qty", "input_lot", "input_lot_qty"
            ];

            // Map data in same order as headers
            const formattedData = containerLines.map((row) => {
                const obj = {};
                headers.forEach((key) => {
                    let value = row[key];
                    if ([
                        "is_receipt_complete",
                        "is_transfer",
                        "is_receipt_sent",
                        "invalid_item",
                        "mantis_imported",
                        "conveyable"
                    ].includes(key)) {
                        value = value ? 1 : 0;
                    }

                    obj[key] = value ?? "";
                });

                return obj;
            });

            // Convert to worksheet
            const worksheet = xlsx.utils.json_to_sheet(formattedData, { header: headers });
            const workbook = { Sheets: { data: worksheet }, SheetNames: ["data"] };
            const excelBuffer = xlsx.write(workbook, {
                bookType: "xlsx",
                type: "array",
            });

            saveAsExcelFile(excelBuffer, "manualContainerDetail_" + containerDetail.ctrnum);
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
    const invalid_itemBodyTemplate = (rowData) => {
        return (
            <>
                {(rowData.invalid_item == 1) ? <Badge value="Yes" severity="danger">N</Badge> : <Badge value="No" severity="success"></Badge>}
            </>
        );
    };
    const conveyableBodyTemplate = (rowData) => {
        return (
            <>
                {(rowData.conveyable == 1) ? <Badge value="No" severity="danger">N</Badge> : <Badge value="Yes" severity="success"></Badge>}
            </>
        );
    };

    const statusBodyTemplate = (rowData) => {

        return (
            <Tag value={rowData.status} severity={getStatusSeverity(rowData.status)} />
        );
    };


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
    const reConveyableItems = () => {
        setDisplayConfirmation1(false)
        setLoading(true);
        ManualContainersService.reValidateConveyAbleItems(params.id).then((data) => {
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
        console.log('here');
        ManualContainersService.reValidateItems(params.id).then((data) => {
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

    const [eaches, seteaches] = useState('');
    const [noLayers, setnoLayers] = useState('');
    const [isconeyableDropdown, setIsconeyableDropdown] = useState("0");
    const readMorePopup = (e, item, event) => {
        e.preventDefault();
        setVisible(true);
        let text = '';
        if (item.data) {
            text += '<h5>Below data created</h5>';
            let keys = Object.keys(item.data);
            keys.forEach((key) => {
                text += key + ' = ' + item.data[key] + "<br>"
            });
        } else if (event == 'sync') {
            text += '<h5>Request</h5>';
            text += '<meta http-equiv="Content-Type" content="text/html; charset=utf-8">' + item.request + '</meta>';
            text += '<br><h5>Response</h5>';
            text += JSON.stringify(item.response);
        } else if (event == 'error') {
            text += '<h5>Exception</h5>';
            text += item.error;
        }
        setDialogText(text)
    }
    const downloadPDF = async () => {
        try {
            setLoading(true);

            // Fetch PDF as blob using params.id
            const { blob, receiptCode } = await ShipmentsService.getcontainerlinesPDF(params.id);

            // Create a URL for the blob
            const url = window.URL.createObjectURL(blob);

            // Construct the filename dynamically
            const now = new Date();
            const formattedDate = now.toISOString().split('T')[0]; // "YYYY-MM-DD"

            const identifier = receiptCode || params.id; // skip if both undefined/null
            const filename = `Container_Report${identifier ? `_${identifier}` : ''}_${formattedDate}.pdf`;
            // const filename = `Container_Report.pdf`;
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

    const [formLoader, setFormLoader] = useState(false);
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
    const [isConveyableitemAttribute, setIsConveyableitemAttribute] = useState(2);
    const [displayConfirmation2, setDisplayConfirmation2] = useState(false);
    const displayAttributesForm = () => {
        setFormLoader(true);
        setDisplayConfirmation2(true)
        ShipmentsService.getItemAttributes(selectedContainers[0].itmref).then((data) => {

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
    const actionItems = [
        hasActionAccess(PAGE_KEY, "add_attributes") &&{
            label: 'Add Attributes',
            icon: 'pi pi-plus',
            command: () => {
                if (selectedContainers != null && selectedContainers.length > 0) {
                    if (selectedContainers.length > 1) {
                        toast.current.show({ severity: 'error', summary: 'Error', detail: 'Kindly select one container' });
                    } else {

                        displayAttributesForm();
                    }


                } else {
                    toast.current.show({ severity: 'error', summary: 'Error', detail: 'Kindly select atleast one container' });
                }
            }
        },

    ].filter(Boolean);
    const [error, setError] = useState(false);

    const header = (
        <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
            <span className="block mt-2 md:mt-0 p-input-icon-left">
                <i className="pi pi-search" />

                <Menu model={actionItems} popup ref={menuLeft} id="popup_menu_left" />
                <Button label="Actions" icon="pi pi-align-left" className="mr-2" onClick={(event) => menuLeft.current.toggle(event)} aria-controls="popup_menu_left" aria-haspopup />


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

    const addAttributes = () => {

        if (eaches.length == 0 && noLayers.length == 0 && isconeyableDropdown == 0) {

            setError(true);
            return false;
        }

        setError(false);
        setbtnDisabled(true);
        setFormLoader(true);
        const data = {
            "item_id": selectedContainers[0].itmref,
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


    const confirmationDialogFooter2 = (
        <>
            <Button type="button" label="Cancel" icon="pi pi-times" disabled={btnDisabled} onClick={() => setDisplayConfirmation2(false)} severity="secondary" />
            <Button type="button" label="Submit" icon="pi pi-check" disabled={btnDisabled} onClick={() => addAttributes()} severity="success" autoFocus />
        </>
    );
    return (
        <>
            <Toast ref={toast} />
            {/* <BreadCrumb model={items} home={home} /> */}
            <Button
                label="Back"
                icon="pi pi-arrow-left"
                className="p-button-primary"
                onClick={() => navigate("/inbound/manual-containers")}
                style={{ margin: '10px 0' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3>Container # {containerDetail.ctrnum}</h3>
                <div className='page-headerActions' style={{ display: "flex", gap: 30, alignItems: 'center' }}>
                    {/* <span onClick={() => setVisibleRight(true)} style={{ cursor: 'pointer', fontWeight: 500, fontSize: '18px', lineHeight: '21px', color: '#222222' }}><i className='pi pi-list' style={{ fontWeight: '600', fontSize: '20px' }}></i><span className='p-badge p-component p-badge-no-gutter p-badge-danger'></span>View Logs</span> */}
                    {/* <span style={{ fontWeight: 500, fontSize: '18px', lineHeight: '21px', color: '#222222' }}><i className='pi m-left' style={{ fontWeight: '500', fontSize: '20px' }}></i> Back</span> */}
                </div>
            </div>
            <h1></h1>
            {/* <Sidebar className='logs_sidebar'  visible={visibleRight} onHide={() => setVisibleRight(false)} baseZIndex={1000} position="right">
                <div className='side_barHeader mt-4'>
                    <div className='left_centent'>Logs</div>
                    <div className='right_centent'><i className='pi m-check-circle mr-1'></i>Mark all as read</div>
                </div>
                <div className='mt-6'>
                    <Timeline className='logs_timeline' value={logs} content={customizedContent} />
                </div>
                
            </Sidebar> */}

            <Dialog header="Log Detail" visible={visible} style={{ width: '50vw' }} onHide={() => setVisible(false)}>
                <p className="m-0" dangerouslySetInnerHTML={{ __html: dialogText }}>
                </p>
            </Dialog>

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
                {/* <h3>Container</h3> */}

                <h1></h1>
                <div className="p-fluid formgrid grid">
                    {containerDetail.ship_date ? (
                        <div className="field col-12 md:col-3">
                            <h5 id="created_at">Ship Date</h5>
                            <p htmlFor="created_at">
                                {containerDetail.ship_date.split('T')[0]}
                            </p>
                        </div>
                    ) : ''}


                    {containerDetail.fcy ? (<div className="field col-12 md:col-3">
                        <h5 id="created_at">Ship From</h5>
                        <p htmlFor="created_at">{containerDetail.fcy}</p>

                    </div>) : ''}
                    <div className="field col-12 md:col-3">
                        <h5 id="created_at">Created At</h5>
                        <p htmlFor="created_at">
                            {containerDetail.created_at
                                ? (() => {
                                    // Split at 'T' and '.'
                                    const [datePart, timePart] = containerDetail.created_at.split('T');
                                    if (!timePart) return containerDetail.created_at;

                                    const [seconds, rest] = timePart.split('.');
                                    // Ensure 6 digits for fractional seconds and append 'Z'
                                    const microseconds = (rest || "000000").padEnd(6, "0");
                                    return `${datePart}T${seconds}.${microseconds}Z`;
                                })()
                                : ''}
                        </p>
                    </div>
                    <div className="field col-12 md:col-3">
                        <h5 id="status">Status</h5>
                        <Tag value={containerDetail.status} severity={getSeverity(containerDetail.status)} />

                    </div>
                </div>
            </div>
            <div className="card">

                <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
                    <span className="block mt-2 md:mt-0 p-input-icon-left">
                        <h3>Container Lines</h3>
                    </span>
                    <span className="flex gap-2 mt-2 md:mt-0 p-input-icon-left">
                        {hasActionAccess(PAGE_KEY, "conveyable_items") &&(<Button label="Conveyable Items" disabled={conveyableBtnDisabled} icon="pi pi-check" severity="secondary" onClick={() => setDisplayConfirmation1(true)} />)}
                        {hasActionAccess(PAGE_KEY, "conveyable_items") &&(<Button label="Re-Validate Items" disabled={revalidateBtnDisabled} icon="pi pi-check" severity="secondary" onClick={() => setDisplayConfirmation(true)} />)}
                    </span>
                </div>
                <h1></h1>
                <DataTable
                    value={containerLines}
                    lazy
                    filterDisplay="row"
                    dataKey="uniqueId"
                    paginator
                    showGridlines
                    header={header}
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
                    emptyMessage="No data found."
                    selection={selectedContainers}
                    onSelectionChange={onSelectionChange}
                    selectAll={selectAll}
                    onSelectAllChange={onSelectAllChange}
                    scrollable
                    scrollHeight="600px"

                >
                    <Column selectionMode="multiple" headerStyle={{ width: '3rem' }} />

                    <Column field="pohnum" header="Order #" body={pohnumBodyTemplate} filterMenuStyle={{ width: '14rem' }} showFilterMenu={false} sortable filter filterPlaceholder="Search" />
                    <Column field="poplin" sortable header="Order Line" body={poplinBodyTemplate} showFilterMenu={false} filter filterPlaceholder="Search" />
                    <Column field="itmref" sortable filter header="Item Ref" body={itmrefDateBodyTemplate} showFilterMenu={false} filterPlaceholder="Search" />
                    <Column field="qtyuom" header="UOM Qty" body={qtyuomBodyTemplate} sortable showFilterMenu={false} filter filterPlaceholder="Search" />
                    <Column field="ctrlin" header="Container Line" body={ctrlinBodyTemplate} showFilterMenu={false} sortable filter filterPlaceholder="Search" />
                    <Column field="qtyweu" sortable header="Weight Qty" body={qtyweuBodyTemplate} showFilterMenu={false} filter filterPlaceholder="Search" />
                    <Column field="qtyvou" sortable filter header="Volume Qty" body={qtyvouBodyTemplate} showFilterMenu={false} filterPlaceholder="Search" />
                    <Column field="uom" header="UOM" body={uomBodyTemplate} showFilterMenu={false} filter filterPlaceholder="Search" />
                    <Column field="mantis_imported" header="Mantis Imported" body={mantisImportedBodyTemplate} showFilterMenu={false} sortable filter filterPlaceholder="Search" />
                    {/* <Column field="is_receipt_complete" sortable header="Receipt Complete" body={isReceiptCompleteBodyTemplate} showFilterMenu={false} filter filterPlaceholder="Search" /> */}
                    {/* <Column field="is_receipt_sent" sortable filter header="Receipt Sent" body={isReceiptSentBodyTemplate} showFilterMenu={false} filterPlaceholder="Search" /> */}
                    <Column field="input_sku" sortable header="Input SKU" body={input_skuBodyTemplate} showFilterMenu={false} filter filterPlaceholder="Search" />
                    <Column field="input_uom" sortable header="Input UOM" body={input_uomBodyTemplate} showFilterMenu={false} filter filterPlaceholder="Search" />
                    <Column field="input_lot_qty" sortable header="Input Qty" body={input_qtyBodyTemplate} showFilterMenu={false} filter filterPlaceholder="Search" />
                    <Column field="input_lot" sortable header="Input LOT" body={(rowData) => rowData.input_lot} showFilterMenu={false} filter filterPlaceholder="Search" />

                    <Column field="invalid_item" header="Invalid Items" body={invalid_itemBodyTemplate} showFilterMenu={false} filter filterPlaceholder="Search" />
                    <Column field="conveyable" header="Conveyable" body={conveyableBodyTemplate} />

                    <Column field="status" style={{ width: '200px' }} header="Status" body={statusBodyTemplate} showFilterMenu={false} filter filterPlaceholder="Search" />

                </DataTable>
            </div>
        </>

    );
}
