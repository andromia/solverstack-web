/**
 * Initial versions of this file will be limited strictly to
 * VRP-tidy uploads and routing outputs.
 * 
 * TODO: improve on *alert*.
 */
import React, { useState, useRef } from "react";
import Papa from "papaparse";
import * as GeoTypes from "../types/geo";

// Bootstrap
import Card from "react-bootstrap/Card";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import FormControl from "react-bootstrap/FormControl";
import Form from "react-bootstrap/Form";
import VrpBubbleMap from "../maps/BubbleMap";
import * as mapUtils from "../maps/Utils";
import Button from "react-bootstrap/Button";


const axios = require('axios');
const defaultMarkers = [{"latitude": -999., "longitude": -999.}];

const checkFileData = (data: Object) => {
    /** 
     * Form utility check for geocodes.
     * 
     * TODO: add unit data check.
     */
    if (!data[0].hasOwnProperty("latitude") || !data[0].hasOwnProperty("longitude")) {
        alert("latitude and longitude fields are required in the damand file!");
    }
}

const checkNum = (val: any) => {
    /**
     * Form utility check for numeric values.
     */
    if (!isFinite(val)) {
        alert("value is not a number!");
    }
}

const checkUnit = (unit: String, data: any) => {
    /**
     * Form utitlity check for validating that the 
     * *unit* field exists in the data provided.
     */
    if (!data[0].hasOwnProperty(unit)) {
        alert("unit entered cannot be found in the demand file!");
    }
}

const getVrpSolution = (data: any) => {
    /**
     * API utility for vrp-rpc post handling.
     * 
     * Returns raw response data.
     */
    axios.post(process.env.dev.VRP_RPC_URL, data)
      .then(function (response) {
        console.log(response);
      }).catch(function (error) {
        console.log(error);
      });
}

const VrpSetup = () => {
    /**
     * Setup page for VRP module. 
     * 
     * Requires users to input origin, vehicle constraints,
     * and demand in the form of a csv file.
     * 
     * TODO: 
     *   - refactor for component-based modules.
     *   - refactor for component-agnostic forms.
     */
    const [originLat, setOriginLat] = useState(-999.),
          [originLon, setOriginLon] = useState(-999.),
          [vehicleCap, setVehicleCap] = useState(-999.9),
          [vehicleUnit, setVehicleUnit] = useState(""),
          [fileName, setFileName] = useState("demand file"),
          [demandMarkers, setDemandMarkers] = useState(defaultMarkers);

    // input refs used to check origin inputs dual-validity; both must be valid coordinates.
    const latRef = useRef<HTMLInputElement>(null),
          lonRef = useRef<HTMLInputElement>(null);

    const onGeoInputUpdate = event => {
        /**
         * Event handler for origin inputs.
         * 
         * TODO: after refactoring, scope of component should
         * be defined at the setup level, therefore if
         * early versions limit scope to the USA, for example,
         * that should be managed at the setup level.
         */
        if (event.target.value == '-') {
            return;
        }

        const latInput = Number(latRef.current?.value);
        const lonInput = Number(lonRef.current?.value);

        checkNum(latInput);
        checkNum(lonInput);

        setOriginLat(latInput);
        setOriginLon(lonInput);
    };
    
    const onFileUpdate = event => {
        /**
         * Event handler for file input.
         * 
         * TODO: for performance we may want to consider
         * leaving data processing to a minimum. Currently
         * this function formats csv files in array<object> JSON
         * format.
         */
        setFileName(event.target.value.split("\\").splice(-1)[0]);

        Papa.parse(event.target.files[0], {
            header: true,
            complete: function(results) {
                checkFileData(results.data);

                setDemandMarkers(results.data);
            }
        });
    };

    const onVehicleCapUpdate = event => {
        /**
         * Event handler for vehicle capacity input.
         * This field initially accepts only integers
         * since our optimization is integer-based. 
         * 
         * TODO: push integer processing/requirement
         * logic to the optimization service.
         */
        const cap = Number(event.target.value);
        checkNum(cap);

        setVehicleCap(cap);
    }

    const onVehicleUnitUpdate = event => {
        /**
         * Event handler for vehicle unit field.
         * This input declares the one unit to 
         * use as the capacity constraint for the
         * optimization model.
         * 
         * TODO: 
         *   - allow more than one unit capacity
         * constraint.
         *   - suggest selection from what isn't
         * latitude or longitude.  
         */
        const unit = String(event.target.value);

        setVehicleUnit(unit);
    }

    const onCreateSubmit = event => {
        /**
         * Event handler for setup create button. 
         * On submit, the data should be checked
         * and passed to the vrp-rpc API. 
         * 
         * TODO: while the model is running animate
         * the nodes on the map according to their 
         * clusters and completion.
         */
        event.preventDefault();

        if (!mapUtils.markerIsContiguousUsa(originLat, originLon)) {
            alert("lattitude and longitude must be within the congiuous USA!");

            return;
        }

        if (!Number.isInteger(vehicleCap)) {
            alert("vehicle capacity is invalid!");

            return;
        }
        
        if (demandMarkers != defaultMarkers) {
            checkUnit(vehicleUnit, demandMarkers);

        } else {
            alert("demand file is invalid!");

            return;
        }

        if (!mapUtils.markersAreContiguousUsa(demandMarkers)) {
            alert("demand latitudes and longitudes must be within the contiguous USA!");
        }

        getVrpSolution({
            origin_latitude: originLat,
            origin_longitude: originLon,
            vehicle_max_capacity_quantity: vehicleCap,
            vehicle_definitions: [], // TODO: remove this for MVP
            unit: vehicleUnit,
            demand: demandMarkers,
        });
    };

    return (
        <Card>
            <Card.Body>
                <Form onSubmit={onCreateSubmit}>
                    <Row className="mb-4">
                        <Col lg="6">
                            <Row className="d-flex flex-column">
                                <Col className="pb-3">
                                    <div>Origin</div>
                                </Col>
                                <Col>
                                    <Row>
                                        <Col>
                                            <FormControl 
                                            id="origin-lat" 
                                            ref={latRef} 
                                            className="d-inline-flex" 
                                            placeholder="lat." 
                                            aria-label="Lat." 
                                            onChange={onGeoInputUpdate} 
                                            autoComplete="off" />
                                        </Col>
                                        <Col>
                                            <FormControl 
                                            id="origin-lon" 
                                            ref={lonRef} 
                                            className="d-inline-flex" 
                                            placeholder="lon." 
                                            aria-label="Lon." 
                                            onChange={onGeoInputUpdate} 
                                            autoComplete="off"/>
                                        </Col>
                                    </Row>
                                </Col>
                            </Row>
                        </Col>
                        <Col lg="6">
                            <Row className="d-flex flex-column">
                                <Col className="pb-3">
                                    <div>Vehicle</div>
                                </Col>
                                <Col>
                                    <Row>
                                        <Col>
                                            <FormControl 
                                            id="max-vehicle-cap"
                                            className="d-inline-flex" 
                                            placeholder="capacity" 
                                            aria-label="capacity" 
                                            onChange={onVehicleCapUpdate} 
                                            autoComplete="off" />
                                        </Col>
                                        <Col>
                                            <FormControl 
                                            id="unit" 
                                            className="d-inline-flex" 
                                            placeholder="unit" 
                                            aria-label="unit" 
                                            onChange={onVehicleUnitUpdate} 
                                            autoComplete="off"/>
                                        </Col>
                                    </Row>
                                </Col>
                            </Row>
                        </Col>
                    </Row>
                    <Row className="mb-4">
                        <Col className="p-0">
                            <VrpBubbleMap 
                            originLat={originLat} 
                            originLon={originLon} 
                            demandMarkers={demandMarkers}
                            width={"100%"} 
                            height={375} />
                        </Col>
                    </Row>
                    <Row className="d-flex justify-content-end">
                        <Col lg="8">
                            <Form.File 
                            id="custom-file" 
                            label={fileName} 
                            custom onChange={onFileUpdate} />
                        </Col>
                        <Col lg="auto">
                            <Button type="submit">Create</Button>
                        </Col>
                    </Row>
                </Form>
            </Card.Body>
        </Card>
    );
};

export default VrpSetup;