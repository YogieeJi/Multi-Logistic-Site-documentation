import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from 'primereact/button';
import { ItemLotExpiryService } from '../../../../service/operations/ItemLotExpiryService';
import { useAuth } from '../../../../store/useAuth';


export default function ItemLotExpDetails() {
    const {hasActionAccess} = useAuth();
    const PAGE_KEY = "Item_lot_expiry_details";
    const [ipDetail, setipDetail] = useState({});

    const navigate = useNavigate();
    const params = useParams();

    useEffect(() => {
        if (params.id && params.id !== "null" && params.id !== "undefined") {
            getDetails(params.id);
        }
    }, [params.id]);

    const getDetails = () => {
        ItemLotExpiryService.getDetail(params.id).then((data) => {
            setipDetail(data.data);
        });
    };

    //  Convert API date --> YYYY-MM-DD
    const formatDate = (dateString) => {
        if (!dateString) return "-";

        // Remove extra spaces, fix AM/PM spacing
        const cleaned = dateString.replace(/\s+/g, " ").trim();
        const normalized = cleaned.replace(/AM|PM/i, m => " " + m);

        const d = new Date(normalized);
        if (isNaN(d)) return "-";

        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");

        return `${year}-${month}-${day}`;
    };

    return (
        <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3>Item Lot Expiry Detail</h3>
                <div className='page-headerActions' style={{ display: "flex", gap: 20, alignItems: 'center' }}>
                    {hasActionAccess(PAGE_KEY,"edit")&&(<Button label="Edit" icon="fa fa-solid fa-pen-to-square" severity="sucess"
                        onClick={() => {
                            if (!ipDetail?.id) {
                                return;
                            }
                            navigate(`/operations/item-lot-expiry/edit/${ipDetail.id}`);
                        }} />)}
                    <Button label="Cancel" severity="secondary" onClick={() => { navigate(`/operations/item-lot-expiry`);}} />
                </div>
            </div>

            <div className="grid">
                <div className="col-12">
                    <div className="card">
                        <br />
                        <div className="p-fluid formgrid grid">

                            <div className="field col-12 md:col-6">
                                <h5>Warehouse</h5>
                                <p>{ipDetail.warehouse || '-'}</p>
                            </div>

                            <div className="field col-12 md:col-6">
                                <h5>Item</h5>
                                <p>{ipDetail.item || '-'}</p>
                            </div>

                            <div className="field col-12 md:col-6">
                                <h5>Lot Number</h5>
                                <p>{ipDetail.lot_number || '-'}</p>
                            </div>

                            <div className="field col-12 md:col-6">
                                <h5>Exp Date</h5>
                                <p>{formatDate(ipDetail.exp_date)}</p>
                            </div>

                            <div className="field col-12 md:col-6">
                                <h5>First Receipt Date</h5>
                                <p>{formatDate(ipDetail.first_receipt_date)}</p>
                            </div>

                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
