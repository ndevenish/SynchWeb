import Users from 'collections/users'
import ProcessingPipelines from 'collections/processingpipelines'
import SpaceGroups from 'collections/spacegroups.js'
import CenteringMethodList from 'utils/centringmethods.js'
import AnomalousList from 'utils/anoms.js'
import ExperimentKindsList from 'utils/experimentkinds.js'
import DistinctProteins from 'modules/shipment/collections/distinctproteins'
import ExperimentTypes from 'modules/shipment/collections/experimenttypes'
import ContainerRegistry from 'modules/shipment/collections/containerregistry'
import ContainerTypes from 'modules/shipment/collections/containertypes'
import SampleGroups from 'collections/samplegroups'
import ImagingImager from 'modules/imaging/collections/imagers'
import ImagingSchedules from 'modules/imaging/collections/schedules'
import ImagingScreens from 'modules/imaging/collections/screens'
import ImagingScheduleComponents from 'modules/imaging/collections/schedulecomponents'
import { mapGetters } from 'vuex'
import Sample from 'models/sample'
import SampleGroupSamples from "collections/samplegroupsamples";

const INITIAL_CONTAINER_TYPE = {
  CONTAINERTYPEID: 0,
  CAPACITY: 0,
  DROPPERWELLX: null,
  DROPPERWELLY: null,
  DROPHEIGHT: null,
  DROPWIDTH: null,
  WELLDROP: -1,
  WELLPERROW: null,
}

export default {
  data() {
    return {
      anomalousList: AnomalousList.list,

      centeringMethods: CenteringMethodList.list,
      containerType: {},
      containerTypes: [],
      containerTypesCollection: null,
      containerRegistryCollection: null,
      containerRegistry: [],
      containerRegistryId: '',
      containerState: {},

      experimentTypes: [],
      experimentTypesCollection: null,
      experimentKindList: [],

      imagingImagers: [],
      imagingCollections: null,
      imagingSchedules: [],
      imagingSchedulesCollection: null,
      imagingScheduleComponents: [],
      imagingScheduleComponentsCollection: null,
      imagingScreens: [],
      imagingScreensCollections: null,

      processingPipeline: '',
      processingPipelines: [],
      proteinsLoaded: false,

      users: [],
      usersCollection: null,

      sampleGroupsCollection: null,
      sampleGroups: [],
      spaceGroups: [],
      spaceGroupsCollection: null,
      sampleGroupSamples: []
    }
  },
  methods: {
    async getUsers() {
      this.usersCollection = new Users(null, { state: { pageSize: 9999 }})
      this.usersCollection.queryParams.all = 1
      this.usersCollection.queryParams.pid = this.$store.state.proposal.proposalModel.get('PROPOSALID')

      const result = await this.$store.dispatch('getCollection', this.usersCollection)
      this.users = result.toJSON()
      // Set plate owner to current user
      this.containerState.PERSONID = this.$store.state.user.personId
    },
    async getProcessingPipelines() {
      let processingPipelinesCollection = new ProcessingPipelines()

      processingPipelinesCollection.queryParams.pipelinestatus = 'optional'
      processingPipelinesCollection.queryParams.category = 'processing'

      const result = await this.$store.dispatch('getCollection', processingPipelinesCollection)
      this.processingPipelines = result.toJSON()
    },
    async getProteins() {
      this.proteinsCollection = new DistinctProteins()
      // If we want to only allow valid samples
      if (app.options.get('valid_components') && !app.staff) {
        this.proteinsCollection.queryParams.external = 1
      }

      this.gProteinsCollection = new DistinctProteins()
      const result = await this.$store.dispatch('getCollection', this.proteinsCollection)
      this.proteins = result.toJSON()
      this.proteinsLoaded = true
    },
    async getExperimentTypes() {
      this.experimentTypesCollection = new ExperimentTypes()

      const result = await this.$store.dispatch('getCollection', this.experimentTypesCollection)
      const proposalExperimentTypes = result.where({ PROPOSALTYPE: this.$store.state.proposal.proposalType })
      this.experimentTypes = proposalExperimentTypes.map(type => type.toJSON())
      this.containerState.EXPERIMENTTYPEID = this.experimentTypes.length > 0 ? this.experimentTypes[0]['EXPERIMENTTYPEID'] : ''
    },
    async getContainerRegistry() {
      this.containerRegistryCollection = new ContainerRegistry(null, { state: { pageSize: 9999 }})
      const result = await this.$store.dispatch('getCollection', this.containerRegistryCollection)
      this.containerRegistry = [{ CONTAINERREGISTRYID: null, BARCODE: ""}, ...result.toJSON()]
    },
    async getContainerTypes() {
      this.containerTypesCollection = new ContainerTypes()

      this.containerFilter = [this.$store.state.proposal.proposalType]

      const result = await this.$store.dispatch('getCollection', this.containerTypesCollection)
      this.containerTypes = result.toJSON()
      // Do we have valid start state?
      if (this.containerTypes.length) {
        let initialContainerType = result.findWhere({PROPOSALTYPE: this.containerFilter[0]})
        this.containerState.CONTAINERTYPEID = initialContainerType ? initialContainerType.get('CONTAINERTYPEID') : ''
      }

      if (this.container) {
        let containerTypeModel = result.findWhere({NAME: this.container.CONTAINERTYPE})

        if (containerTypeModel) {
          this.containerType = Object.assign(INITIAL_CONTAINER_TYPE, containerTypeModel.toJSON())
        }
      }
    },
    formatExperimentKindList() {
      let experimentKindList = []
      for (const [key, value] of Object.entries(ExperimentKindsList.list)) {
        experimentKindList.push({ value, text: key })
      }

      this.experimentKindList = experimentKindList.filter(experimentKind => experimentKind.value)
    },
    async getSampleGroups() {
      this.sampleGroupsCollection = new SampleGroups(null, { state: { pageSize: 9999 }})

      const result = await this.$store.dispatch('getCollection', this.sampleGroupsCollection)

      this.sampleGroups = result.toJSON().map((group, index) => ({
        value: group.BLSAMPLEGROUPID,
        text: group.NAME || `Unknown Sample Group ${index}`
      }))
    },
    async getImagingCollections() {
      this.imagingCollections = new ImagingImager()
      this.imagingCollections.queryParams.pageSize = 9999

      const result = await this.$store.dispatch('getCollection', this.imagingCollections)
      this.imagingImagers = result.toJSON()
    },
    async getImagingScheduleCollections() {
      this.imagingSchedulesCollection = new ImagingSchedules()
      this.imagingSchedulesCollection.queryParams.pageSize = 9999

      const result = await this.$store.dispatch('getCollection', this.imagingSchedulesCollection)
      this.imagingSchedules = result.toJSON()
    },
    async getImagingScreensCollections() {
      this.imagingScreensCollection = new ImagingScreens()
      this.imagingScreensCollection.queryParams.pageSize = 9999

      const result = await this.$store.dispatch('getCollection', this.imagingScreensCollection)
      this.imagingScreens = result.toJSON()
    },
    async getImagingScheduleComponentsCollection() {
      this.imagingScheduleComponentsCollection = new ImagingScheduleComponents()
      this.imagingScheduleComponentsCollection.queryParams.pageSize = 9999
      this.imagingScheduleComponentsCollection.queryParams.shid = this.selectedSchedule.SCHEDULEID

      const result = await this.$store.dispatch('getCollection', this.imagingScheduleComponentsCollection)
      this.imagingScheduleComponents = result.toJSON()
    },
    async getSpaceGroupsCollection() {
      this.spaceGroupsCollection = new SpaceGroups()
      this.spaceGroupsCollection.queryParams.pageSize = 9999
      if (!this.containerState.SPACEGROUP) {
        this.spaceGroupsCollection.queryParams.ty = this.containerGroup
      }

      const result = await this.$store.dispatch('getCollection', this.spaceGroupsCollection)
      this.spaceGroups = result.toJSON()
    },


    // Clone the next free row based on the current row
    onCloneSample(sampleLocation) {
      // Make sure we are using numbers for locations
      let location = +sampleLocation
      // Take the next sample in the list and copy this data
      // Locations should be in range 1..samples.length-1 (can't clone last sample in list)
      if (location < 0 || location > (this.samples.length-1)) return

      // Sample to be copied and next index
      let nextSampleIndex = -1
      // Recreate current behaviour - find the next non-zero protein id
      // This means you can click any row icon and it will fill whatever is the next empty link item based on protein id/valid acronym
      for (let i = location; i < this.samples.length; i++) {
        if (+this.samples[i]['PROTEINID'] < 0) {
          nextSampleIndex = i
          break
        }
      }

      this.cloneSample(location, nextSampleIndex)
    },
    // Clear row for a single row in the sample table
    onClearSample(sampleLocation) {
      let location = +sampleLocation
      // Clear the row for this location
      // Locations should be in range 1..samples.length
      if (location < 0 || location > this.samples.length) return
      // The location is one more than the sample index
      this.$store.commit('samples/clearSample', location)
    },
    // Take first entry (or index) and clone all rows
    onCloneContainer(sampleIndex=0) {
      for (let i = 0; i < this.samples.length; i++) {
        this.cloneSample(sampleIndex, i)
      }
    },
    // Remove all sample information from every row
    onClearContainer() {
      for (let i = 0; i < this.samples.length; i++) {
        this.$store.commit('samples/clearSample', i)
      }
    },
    // When cloning, take the last digits and pad the new samples names
    // So if 1: sample-01, 2: will equal sample-02 etc.
    generateSampleName(name, startAtIndex) {
      if (!name) return null

      let name_base = name.replace(/([\d]+)$/, '')
      let digits = name.match(/([\d]+)$/)
      let number_pad = (digits && digits.length > 1) ? digits[1].length : 0

      return name_base+((startAtIndex).toString().padStart(number_pad, '0'))
    },
    // Save the sample to the server via backbone model
    // Location should be the sample LOCATION
    async onSaveSample(location) {
      const result = await this.$refs.containerForm.validate()
      if (result) {
        await this.saveSample(location)
        this.$refs.samples.closeSampleEditing()
      }
      else {
        this.$store.commit('notifications/addNotification', { message: 'Sample data is invalid, please check the form', level: 'error'})
      }
    },
    async saveSample(location) {
      let sampleIndex = +location
      // Create a new Sample Model so it uses the BLSAMPLEID to check for post, update etc
      let sampleModel = new Sample( this.samples[sampleIndex] )

      const result = await this.$store.dispatch('saveModel', { model: sampleModel })

      if (!this.samples[sampleIndex]['BLSAMPLEID'])
        this.$store.commit('samples/updateSamplesField', {
          path: `samples/${sampleIndex}/BLSAMPLEID`,
          value: result.get('BLSAMPLEID')
        })
    },
    getRowColDrop(pos) {
      let well = this.containerType.WELLDROP > -1 ? 1 : 0
      let dropTotal = (this.containerType.DROPPERWELLX * this.containerType.DROPPERWELLY) - well

      const wellPosition = Math.floor((parseInt(pos) - 1) / dropTotal);
      const drop = ((pos - 1) % dropTotal) + 1;

      const col = wellPosition % this.containerType.WELLPERROW;
      const row = Math.floor(wellPosition / this.containerType.WELLPERROW);

      return { row: row, col: col, drop: drop, pos: pos }
    },
    // While updating the sample locations during the cloning, the update will stop is one of the form field is invalid.
    async onCloneColumn(location) {
      let sampleIndex = +location - 1
      let sourceCoordinates = this.getRowColDrop(location)

      for (let i = 0; i < this.samples.length; i++) {
        // We are only cloning samples that come after this one - so skip any with a lower index
        if (i > sampleIndex) {
          let targetCoordinates = this.getRowColDrop(this.samples[i].LOCATION)

          if (targetCoordinates['drop'] === sourceCoordinates['drop'] && targetCoordinates['col'] === sourceCoordinates['col']) {
            this.cloneSample(sampleIndex, i)
            this.sampleLocation = i

            await this.$nextTick()
            const locationValid = await this.$refs.containerForm.validate();

            if (!locationValid) {
              break
            } else {
              this.$store.commit('samples/updateSamplesField', {
                path: `samples/${sampleIndex}/VALID`,
                value: 1
              })
            }
          }
        }
      }
    },
    // While updating the sample locations during the cloning, the update will stop is one of the form field is invalid.
    async onCloneRow(location) {
      let sampleIndex = +location - 1
      let sourceCoordinates = this.getRowColDrop(location)

      for (let i = 0; i < this.samples.length; i++) {
        // We are only cloning samples that come after this one - so skip any with a lower index
        if (i > sampleIndex) {
          let targetCoordinates = this.getRowColDrop(this.samples[i].LOCATION)

          if (targetCoordinates['drop'] === sourceCoordinates['drop'] && targetCoordinates['row'] === sourceCoordinates['row']) {
            this.cloneSample(sampleIndex, i)
            this.sampleLocation = i

            await this.$nextTick()
            const locationValid = await this.$refs.containerForm.validate();

            if (!locationValid) {
              break
            } else {
              this.$store.commit('samples/updateSamplesField', {
                path: `samples/${sampleIndex}/VALID`,
                value: 1
              })
            }
          }
        }
      }
    },
    cloneSample(sourceIndex, targetIndex) {
      if (targetIndex < 0 || targetIndex >= this.samples.length) return false
      if (sourceIndex < 0 || sourceIndex >= this.samples.length) return false

      let sourceSample = this.samples[sourceIndex]
      if (sourceSample.PROTEINID < 0) return false

      let baseName = this.samples[sourceIndex].NAME
      let sampleClone = { ...this.samples[targetIndex], ...this.samples[sourceIndex] }
      sampleClone.LOCATION = (targetIndex + 1).toString()
      sampleClone.NAME = this.generateSampleName(baseName, targetIndex+1)
      this.$store.commit('samples/setSample', { index: targetIndex, data: sampleClone })
    },
    // Reset the validation for the field when an input is edited
    resetFormValidation() {
      requestAnimationFrame(() => {
        this.$refs.containerForm.reset()
      })
    },
    async fetchSampleGroupSamples() {
      const sampleGroupCollection = new SampleGroups(null, { state: { pageSize: 9999 } })

      const result = await this.$store.dispatch('getCollection', sampleGroupCollection)
      const sampleGroups = result.toJSON()

      let sampleGroupSamples = []
      let sampleGroupSamplesPromise = []

      for (let i = 0; i < sampleGroups.length; i++) {
        const sampleGroupSamplesCollection = new SampleGroupSamples
        sampleGroupSamplesCollection.sampleGroupId = sampleGroups[i].BLSAMPLEGROUPID
        sampleGroupSamplesPromise.push(this.$store.dispatch('getCollection', sampleGroupSamplesCollection))
      }
      const samplesGroupResult = await Promise.all(sampleGroupSamplesPromise)

      for (let j = 0; j < samplesGroupResult.length; j++) {
        sampleGroupSamples = sampleGroupSamples.concat(samplesGroupResult[j].toJSON())
      }

      this.sampleGroupSamples = sampleGroupSamples
    }
  },
  computed: {
    containerFilter: function() {
      return [this.$store.state.proposal.proposalType]
    },
    isPuck() {
      return this.containerType.WELLPERROW === null
    },
    isPlate() {
      return this.containerType.WELLPERROW > 0
    },
    ...mapGetters({
      samples: ['samples/samples'],
    })
  },
  provide() {
    return {
      $spaceGroups: () => this.spaceGroups,
      $centeringMethods: () => this.centeringMethods,
      $anomalousList: () => this.anomalousList,
      $experimentKindList: () => this.experimentKindList,
      $sampleLocation: () => this.sampleLocation,
      $sampleGroups: () => this.sampleGroups,
      $queueForUDC: () => this.containerState.QUEUEFORUDC,
      $proteins: () => this.proteins,
      $sampleGroupsSamples: () => this.sampleGroupSamples
    }
  }
}