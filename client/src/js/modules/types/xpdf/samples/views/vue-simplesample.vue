<template>
  <div>
    <form
      id="add_protein"
      method="post"
      :class="{loading: isLoading}"
      @submit.prevent="onSubmit"
    >
      <div class="form">
        <input
          id="file"
          v-model="fileUpload"
          type="radio"
          name="fileupload"
          value="multi"
          checked="checked"
          :value="true"
        >
        <label for="file">File Upload for Multiple Samples</label><br>
        <input
          id="form"
          v-model="fileUpload"
          type="radio"
          name="fileupload"
          value="single"
          :value="false"
        >
        <label for="form">Form for Single Sample</label><br>

        <section v-if="fileUpload">
          <!--<ul v-if="!csvErrors.length">-->
          <ul>
            <li
              v-for="csvError in csvErrors"
              style="color:red; font-size:medium"
            >
              {{ csvError }}
            </li>
          </ul>
          <ul>
            <li>
              <span class="file">
                <input
                  type="file"
                  name="csv_file"
                  accept=".csv"
                  @change="setCSVFile($event)"
                >
                <span
                  v-if="fileValid"
                  style="color:green; font-size:medium"
                >File OK</span>
                <button
                  type="button"
                  onclick="window.open('/assets/files/simple_sample_csv_template.csv');return false"
                >Download CSV Template</button>
              </span>
              <p>CSV files must contain 4 comma separated columns with the following mandatory headers on the first row: Acronym,Composition,Density,Packing Fraction</p>
              <p>An optional column is: Comments</p>
            </li>
          </ul>
          <br><br>
        </section>

        <section v-else>
          <ul>
            <li>
              <label>Name
                <span class="small">Name of the sample</span></label>
              <span class="name"><input
                v-model="name"
                v-validate="'required'"
                type="text"
                name="name"
                :class="{ferror: errors.has('name')}"
                :disabled="proteinid"
              ></span>
              <span
                v-if="errors.has('name')"
                class="errormessage ferror"
              >{{ errors.first('name') }}</span>
            </li>

            <li>
              <label>Acronym
                <span class="small">Short form name for sample (must be unique!)</span></label>
              <span class="name"><input
                v-model="acronym"
                v-validate="'required'"
                type="text"
                name="acronym"
                :class="{ferror: errors.has('acronym')}"
              ></span>
              <span
                v-if="errors.has('acronym')"
                class="errormessage ferror"
              >{{ errors.first('acronym') }}</span>
            </li>

            <li>
              <label>Composition
                <span class="small">Chemical formula of the material</span></label>
              <span class="composition"><input
                v-model="seq"
                v-validate="{required: true, closeExp: true, regex:/^[a-zA-Z0-9\(\)\.]*$/ }"
                type="text"
                name="seq"
                :class="{ferror: errors.has('seq')}"
              ></span>
              <span
                v-if="errors.has('seq')"
                class="errormessage ferror"
              >{{ errors.first('seq') }}</span>
            </li>

            <li>
              <label>Density
                <span class="small">Crystallographic density of the phase (g cm<span class="super">-3</span>)</span></label>
              <span><input
                v-model="density"
                v-validate="'required|decimal'"
                type="text"
                name="density"
                :class="{ferror: errors.has('density')}"
              ></span>
              <span
                v-if="errors.has('density')"
                class="errormessage ferror"
              >{{ errors.first('density') }}</span>
            </li>

            <li>
              <label>Packing Fraction
                <span class="small">Must be between 0 and 1</span>
              </label>
              <span><input
                v-model="fraction"
                v-validate="'required|min_value:0|max_value:1'"
                type="text"
                name="fraction"
                :class="{ferror: errors.has('fraction')}"
              ></span>
              <span
                v-if="errors.has('fraction')"
                class="errormessage ferror"
              >{{ errors.first('fraction') }}</span>
            </li>

            <li>
              <label>Comments</label>
              <span><textarea
                v-model="comments"
                name="comments"
                maxlength="255"
                style="width:400px;height:80px"
              /></span>
            </li>
          </ul>
        </section>

        <ul>
          <li>
            <label>Exposure Time
              <span class="small">Must be a non negative integer</span>
            </label>
            <span><input
              v-model="expTime"
              v-validate="'required|min_value:0'"
              type="text"
              name="expTime"
              :class="{ferror: errors.has('expTime')}"
            ></span>
            <span
              v-if="errors.has('expTime')"
              class="errormessage ferror"
            >{{ errors.first('expTime') }}</span>
          </li>

          <li>
            <label>Not in Capillary?</label>
            <span><input
              v-model="containerless"
              type="checkbox"
            ></span><br>
          </li>

          <li>
            <label>Capillary
              <span class="small">The capillary or container that should be associated with this sample</span>
            </label>
            <select
              id="containerSelect"
              v-model="type"
              v-validate="'required'"
              name="type"
              style="width: 400px"
              :disabled="containerless"
              @change="getCapillaryInfo('density')"
            >
              <option
                v-if="!hasExistingCapillaries"
                disabled
                value=""
              >
                Container*
              </option>
              <option v-for="container in containers">
                {{ container }}
              </option>
            </select>
            <span
              v-if="errors.has('type')"
              class="errormessage ferror"
            >{{ errors.first('type') }}</span>
          </li>
        </ul>

        <button
          type="button"
          @click="showCifFileDialog()"
        >
          Upload CIF
        </button>
        <div v-show="showUploadDialog">
          <ul>
            <li>
              <label>Type:</label>
              <span>
                <select name="type">
                  <option value="pdb_file">File</option>
                </select>
              </span>
            </li>

            <li class="ty pdb_file">
              <label>File:</label>
              <span class="file">
                <input
                  type="file"
                  name="pdb_file[]"
                  multiple
                  @change="setCifFile($event)"
                >
              </span>
            </li>
          </ul>
          <div class="progress" />
        </div>
        <p>Add a cif file to this sample to enable downstream processing of your data</p>

        <br>

        <button
          name="submit"
          value="1"
          type="submit"
          class="button submit"
        >
          <i class="fa fa-plus" /> Add Sample
        </button>
      </div>
    </form>
  </div>
</template>

<script>
    import Phase from 'models/protein'
    import Crystal from 'models/crystal'
    import Container from 'models/container'
    import MultiModelFileWrapper from 'models/multimodelfilewrapper'
    import phaseCompositor from 'modules/types/xpdf/utils/phasecompositor'
    import Capillaries from 'modules/types/xpdf/collections/capillaries'
    import SampleGroups from 'collections/samplegroups'
    import CSVFileValidator from 'csv-file-validator'

    const requiredError = (headerName, rowNumber, columnNumber) => {
        return `${headerName} is required in row ${rowNumber} / column ${columnNumber}`
    }
    const headerError = (headerName) => {
        return `Please add a column header for ${headerName}`
    }

    const csvConfig = {
        headers: [
            {
                name: 'Acronym',
                inputName: 'acronym',
                required: true,
                requiredError,
                headerError
            },
            {
                name: 'Composition',
                inputName: 'composition',
                required: true,
                requiredError,
                headerError,
                validate: function(composition){
                    if(composition.includes('[') || composition.includes(']') || composition.includes('{') || composition.includes('}'))
                        return false

                    var count = 0
                    for(var i=0;i<composition.length;i++){
                        if(composition.charAt(i) === '(')
                            count++
                        else if(composition.charAt(i) === ')'){
                            if(count === 0)
                                return false
                            else
                                count--
                        }
                    }
                    return count === 0;
                },
                validateError: function(headerName, rowNumber, columnNumber){
                    return `${headerName} cannot have [] or {} and any () must be correctly closed in row ${rowNumber} / column ${columnNumber}`
                }
            },
            {
                name: 'Density',
                inputName: 'density',
                required: true,
                requiredError,
                headerError,
                validate: function(density){
                    return !isNaN(density)
                },
                validateError: function(headerName, rowNumber, columnNumber){
                    return `${headerName} must be a numeric decimal number in row ${rowNumber} / column ${columnNumber}`
                }
            },
            {
                name: 'Packing Fraction',
                inputName: 'packingFraction',
                required: true,
                requiredError,
                headerError,
                validate: function(packingFraction){
                    return !isNaN(packingFraction) && packingFraction >= 0 && packingFraction <= 1
                },
                validateError: function(headerName, rowNumber, columnNumber){
                    return `${headerName} must be a number between 0 and 1 in row ${rowNumber} / column ${columnNumber}`
                }
            },
            {
                name: 'Comments',
                inputName: 'comments',
                optional: true
            },
        ]
    }

    export default {
        name: 'SimpleSample',
        props: {
            protein: {
                type: Object
            }
        },

        data: function(){
            return {
                // Probably shouldn't be getting from the prototype...
                capillaries: new Capillaries().__proto__.capillaries,
                existingCapillaryID: null,
                seq: '',
                type: '',
                capacity: 25,
                name: '',
                acronym: null,
                density: '',
                fraction: null,
                containers: [],
                showUploadDialog: false,
                cifFiles: [],
                comments: '',
                isLoading: false,
                containerless: false,
                hasExistingCapillaries: false,
                defaultDewarId: null,
                expTime: 600,
                fileUpload: false,
                fileValid: false,
                csvFile: null,
                csvData: [],
                csvErrors: [],
                commaInComments: false,
                duplicateAcronym: false,
                duplicateAcronymRows: [],
                proteinid: null,
                externalid: null,
                sampleGroupCollection: null,
                sampleGroups: [],
                lastestSampleGroup: {},
                sampleGroupSamplesCollection: null,
                sampleGroupSamples: []
            }
        },

        created: function(){
            this.setDewarInformation()
            this.fetchSampleGroupsAndAssignContainers()
            this.setProteinData()
        },

        methods: {
            async setDewarInformation() {
              // Try to retrieve the default dewar for this proposal/visit
              this.defaultDewarId = await this.$store.dispatch('fetchDataFromApi', {
                url: '/shipment/dewars/default',
                requestType: 'fetching default dewar for this proposal/visit'
              })
            },
            setProteinData() {
              // We should have arrived with an existing Phase to base the new simple samples on
              // pre-populate fields with useful information
              const protein = this.protein.toJSON()
              this.name = protein.NAME
              this.acronym = protein.ACRONYM
              this.seq = protein.SEQUENCE
              this.density = protein.DENSITY
              this.proteinid = protein.PROTEINID
              this.externalid = protein.EXTERNALID
            },
            async fetchSampleGroupsAndAssignContainers() {
                const existingSamples = new Set()
                let lastCapillaryId = 0
                let lastCapillaryGroupId = 0

                const sampleGroups = await this.$store.dispatch('fetchDataFromApi', {
                  url: '/sample/groups?page=1&per_page=9999',
                  requestType: 'fetching sample groups'
                })

                this.sampleGroups = sampleGroups.data
                this.sampleGroups.forEach(sample => {
                    if (sample.TYPE === 'container' || sample.TYPE === 'capillary') {
                        if (Number(sample.BLSAMPLEGROUPID) > lastCapillaryGroupId) {
                            lastCapillaryId = sample.CRYSTALID
                            lastCapillaryGroupId = sample.BLSAMPLEGROUPID
                        }
                        existingSamples.add(`${sample.CRYSTALID}:${sample.CRYSTAL}`)
                    }
                })

                const existingSamplesArray = Array.from(existingSamples)

                if (existingSamplesArray.length > 0) {
                    this.hasExistingCapillaries = true
                    existingSamplesArray.forEach(sample => {
                        if (sample.startsWith(lastCapillaryId)) this.type = sample
                    })
                }

                this.capillaries.forEach(capillary => {
                  this.containers.push(capillary.name)
                })

                this.containers = this.containers.concat(existingSamplesArray)
            },
            onSubmit: function(e){
                e.preventDefault()
                let self = this
                
                this.$validator.validateAll().then(function(result){
                    if(self.fileUpload){
                        if(result && self.fileValid && self.csvErrors.length === 0 && self.defaultDewarId){
                            self.prepareFromFile()
                        } else {
                            console.log('File submission prevented, validation failed');
                            app.alert({ title: 'Error', message: 'File validation failed, or default dewar for this visit could not be created' })
                        }
                    } else {
                        if(result && self.defaultDewarId){
                            self.prepareSimpleSample()
                        } else {
                            console.log('Form submission prevented, validation failed');
                            app.alert({ title: 'Error', message: 'Form validation failed, or default dewar for this visit could not be created' })
                        }
                    }
                    
                })
            },

            prepareFromFile: function(){
                this.isLoading = true
                console.log('preparing from file')

                let models = new MultiModelFileWrapper({
                    urlRoot: '/sample/simple',
                })
                let self = this

                this.csvData.forEach(function(item, index){
                    if(index === 0)
                        return;

                    console.log(item)
                    var shortName = ''

                    if(self.type.endsWith('_CP') || self.type.endsWith('_Capillary'))
                        self.existingCapillaryID = self.type.substring(0, self.type.indexOf(':'))
                    else
                        shortName = '_' + self.capillaries.find(cap => cap.name === self.type).short_name
                    
                    let capillaryPhase = new Phase({
                        NAME: self.name + '_CPM',
                        ACRONYM: 'xpdfCapillary'+(new Date().getTime().toString()+'_'+index),
                        DENSITY: self.getCapillaryInfo('density') != null ? self.getCapillaryInfo('density') : null,
                        SEQUENCE: self.getCapillaryInfo('sequence') != null ? self.getCapillaryInfo('sequence') : null,
                        MOLECULARMASS: self.getCapillaryInfo('sequence') != null ? phaseCompositor.molecularMassFromComposition(self.getCapillaryInfo('sequence')) : null
                    })

                    let capillaryCrystal = new Crystal({
                        CRYSTALID: self.existingCapillaryID,
                        NAME: self.name + shortName + '_CP',
                        THEORETICALDENSITY: self.getCapillaryInfo('density') != null ? self.getCapillaryInfo('density') : null,
                        ABUNDANCE: 1,
                        CONTAINERLESS: self.containerless,
                        OUTERDIAMETER: self.getCapillaryInfo('outer_diameter') != null ? self.getCapillaryInfo('outer_diameter') : null,
                        INNERDIAMETER: self.getCapillaryInfo('inner_diameter') != null ? self.getCapillaryInfo('inner_diameter') : null,
                        LENGTH: self.getCapillaryInfo('length') != null ? self.getCapillaryInfo('length') : null,
                        SHAPE: 'cylinder'
                    })

                    let phase = new Phase({
                        NAME: self.name,
                        ACRONYM: item.acronym,
                        DENSITY: item.density,
                        MOLECULARMASS: phaseCompositor.molecularMassFromComposition(item.composition),
                        SEQUENCE: item.composition,
                        EXTERNALID: self.externalid
                    })

                    let crystal = new Crystal({
                        NAME: self.name,
                        COMMENTS: item.comments,
                        THEORETICALDENSITY: item.density,
                        ABUNDANCE: 1
                    })

                    let container = new Container({
                        NAME: app.visit ? app.prop + '-' + app.visit + '_samples' : app.prop + '_samples',
                        CAPACITY: self.capacity,
                        CONTAINERTYPE: 'Box',
                        COMMENTS: item.comments
                    })

                    let model = new MultiModelFileWrapper({
                        capillaryPhase: capillaryPhase,
                        phase: phase,
                        crystal: crystal,
                        capillary: capillaryCrystal,
                        container: container,
                        PACKINGFRACTION: item.packingFraction,
                        DEWARID: self.defaultDewarId,
                        EXPOSURETIME: self.expTime,
                        prop: app.prop,
                        fromFile: true
                    })

                    models.set('sample_'+index, model)
                })

                for(var i=0; i < self.cifFiles.length; i++){
                    var name = 'pdb_file_'+i
                    models.set(name, self.cifFiles[i]);
                }
                console.log(models)

                this.submitSimpleSample(models)
            },

            prepareSimpleSample: function(){

                this.isLoading = true
                var shortName = ''

                if(this.type.endsWith('_CP') || this.type.endsWith('_Capillary'))
                    this.existingCapillaryID = this.type.substring(0, this.type.indexOf(':'))
                else
                    shortName = '_' + this.capillaries.find(cap => cap.name === this.type).short_name

                let capillaryPhase = new Phase({
                    NAME: this.name + '_CPM',
                    ACRONYM: 'xpdfCapillary'+(new Date().getTime().toString()),
                    DENSITY: this.getCapillaryInfo('density') != null ? this.getCapillaryInfo('density') : null,
                    SEQUENCE: this.getCapillaryInfo('sequence') != null ? this.getCapillaryInfo('sequence') : null,
                    MOLECULARMASS: this.getCapillaryInfo('sequence') != null ? phaseCompositor.molecularMassFromComposition(this.getCapillaryInfo('sequence')) : null
                })

                let capillaryCrystal = new Crystal({
                    CRYSTALID: this.existingCapillaryID,
                    NAME: this.name + shortName + '_CP',
                    THEORETICALDENSITY: this.getCapillaryInfo('density') != null ? this.getCapillaryInfo('density') : null,
                    ABUNDANCE: 1,
                    CONTAINERLESS: this.containerless,
                    OUTERDIAMETER: this.getCapillaryInfo('outer_diameter') != null ? this.getCapillaryInfo('outer_diameter') : null,
                    INNERDIAMETER: this.getCapillaryInfo('inner_diameter') != null ? this.getCapillaryInfo('inner_diameter') : null,
                    LENGTH: this.getCapillaryInfo('length') != null ? this.getCapillaryInfo('length') : null,
                    SHAPE: 'cylinder'
                })

                let phase = new Phase({
                    NAME: this.name,
                    ACRONYM: this.acronym != null ? this.acronym : 'xpdfPhase'+(new Date().getTime().toString()),
                    DENSITY: this.density,
                    MOLECULARMASS: phaseCompositor.molecularMassFromComposition(this.seq),
                    SEQUENCE: this.seq,
                    EXTERNALID: this.externalid,
                })

                let crystal = new Crystal({
                    NAME: this.name,
                    COMMENTS: this.comments,
                    THEORETICALDENSITY: this.density,
                    ABUNDANCE: 1
                })

                let container = new Container({
                    NAME: app.visit ? app.prop + '-' + app.visit + '_samples' : app.prop + '_samples',
                    CAPACITY: this.capacity,
                    CONTAINERTYPE: 'Box',
                    COMMENTS: this.comments
                })

                let model = new MultiModelFileWrapper({
                    capillaryPhase: capillaryPhase,
                    phase: phase,
                    crystal: crystal,
                    capillary: capillaryCrystal,
                    container: container,
                    PACKINGFRACTION: this.fraction,
                    DEWARID: this.defaultDewarId,
                    EXPOSURETIME: this.expTime,
                    prop: app.prop,
                    fromFile: false
                })

                let models = new MultiModelFileWrapper({
                    urlRoot: '/sample/simple',
                })

                models.set('sample_1', model)

                for(var i=0; i < this.cifFiles.length; i++){
                    var name = 'pdb_file_'+i
                    models.set(name, this.cifFiles[i]);
                }

                this.submitSimpleSample(models)
            },

            submitSimpleSample: function(models){
                let self = this

                models.save({}, {
                    success: function(model, response){
                        app.alert({className: 'message notify', message: "Successfully added sample and relevant capillary data."})
                        self.isLoading = false
                        if(self.fileUpload){
                            app.trigger('proteins:show')
                        } else {
                            app.trigger('phases:view', response.sample_1.PHASEID)
                        }
                    },
                    error: function(model, response){
                        let alertMessage = "Failed to add Simple Sample information"

                        let responseObj = JSON.parse(response.responseText)

                        if('message' in responseObj){
                            alertMessage = alertMessage + ': ' + responseObj.message
                        }

                        app.alert({message: alertMessage})
                        self.isLoading = false
                    }
                })
            },

            getCapillaryInfo: function(field) {
                for(let i=0;i<this.capillaries.length;i++){
                    if(this.capillaries[i].name === this.type){
                        return this.capillaries[i][field];
                    }
                }
                return null
            },

            showCifFileDialog: function() {
                this.showUploadDialog ? this.showUploadDialog = false : this.showUploadDialog = true
            },

            setCifFile: function(event){
                for(var i=0; i < event.target.files.length; i++){
                    this.cifFiles[i] = event.target.files[i]
                }
                console.log(this.cifFiles)
            },
            
            setCSVFile: function(event){
                this.csvData = []
                this.csvErrors = []
                this.duplicateAcronym = false
                this.duplicateAcronymRows = []

                if(event.target.files.length === 0){
                    this.fileValid = false
                    this.csvFile = null
                    return
                }

                this.csvFile = event.target.files[0]
                var self = this
                var ready = false

                // callback function to make sure we have finished trimming white space from uploaded file
                // before passing it through the CSVFileValidator
                var check = function(){
                    if(ready === true){
                        CSVFileValidator(self.csvFile, csvConfig)
                        .then(csvData => {
                            self.csvData = csvData.data
                            self.csvErrors = csvData.inValidMessages

                            if(self.commaInComments)
                                self.csvErrors.push("Column count is greater than expected, you likely have a comma in a comment. Please remove any additional commas")

                            if(self.csvData.length === 1 && self.csvErrors.length === 0){
                                self.csvErrors.push("Only headers have been submitted, please add some sample information")
                            }

                            if(self.duplicateAcronym)
                                self.csvErrors = self.csvErrors.concat(self.duplicateAcronymRows)

                            if(self.csvErrors.length === 0)
                                self.fileValid = true
                            else {
                                self.fileValid = false
                                event.target.value = ''
                            }

                            console.log(csvData.data)
                            console.log(csvData.inValidMessages)
                        })
                    } else {
                        setTimeout(check, 1000)
                    }
                }
                check()

                // CSVFileValidator library doesn't handle white space, so we need to remove it
                // by trimming the data then writing it back to a Blob
                // It's pretty cool we can 'edit' files in memory client side with JavaScript!
                var reader = new FileReader()
                reader.onload = function(e) {
                    // If we have more than 5 cells per row there is probably a rogue comma
                    // We won't try to fix this, just tell the user
                    self.commaInComments = false;
                    var newLineSplit = e.target.result.split("\n")
                    newLineSplit.forEach(function(row){
                        var cells = row.split(',')
                        if(cells.length > 5){
                            self.commaInComments = true
                            ready = true
                        }
                    })

                    // Display duplicate acronyms and the row they are on (only in file duplicates, not against database)
                    // Hopefully this issue gets implemented then we can remove all this. https://github.com/shystruk/csv-file-validator/issues/20
                    var acronyms = []
                    var acronymIndex = 5

                    for(var i=0; i<newLineSplit.length; i++){
                        var cells = newLineSplit[i].split(',')

                        for(var j=0; j<cells.length; j++){
                            // if first row check which column is the Acronym
                            if(i === 0){
                                if(cells[j] === 'Acronym'){
                                    acronymIndex = j
                                    break
                                }
                            }
                            // ignore any non acronym columns
                            if(j !== acronymIndex) break

                            for(let k=0; k < acronyms.length; k++){
                                if(acronyms[k] === cells[j]){
                                    var currentRow = i
                                    self.duplicateAcronym = true
                                    self.duplicateAcronymRows.push(cells[j] + ' is a duplicate acronym on row ' + ++currentRow)
                                    break
                                }
                            }

                            acronyms[i] = cells[acronymIndex]
                        }
                    }

                    // Remove all leading and trailing white space
                    // Also clean up trailing commas on each row to ensure new line works as expected
                    var trimmed = ''
                    newLineSplit.forEach(function(row){
                        var cells = row.split(',')
                        cells.forEach(function(cell, index){
                            i = index + 1
                            trimmed += cell.trim()
                            if(cells.length !== i){
                                trimmed += ','
                            } else {
                                if(trimmed.endsWith(','))
                                    trimmed = trimmed.substring(0, trimmed.length-1)
                                trimmed += "\n"
                            }
                        })
                    })

                    var blob = new Blob([trimmed], {type:self.csvFile.type});
                    blob.name = self.csvFile.name
                    self.csvFile = blob
                    ready = true
                }
                reader.readAsText(this.csvFile)
            },

            sortItemsByField(a, b) {
              return (field) => {
                if (Number(a[field]) > Number(b[field])) {
                  return 1
                } else if (Number(a[field]) < Number(b[field])) {
                  return -1
                }

                return 0
              }
            }
        }
    }
</script>
