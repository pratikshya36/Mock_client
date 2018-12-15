import React, { Component } from 'react';
    import axios from 'axios';
// import './style.css';
export default    class UserForm extends Component {
      constructor() {
        super();
        this.state = {
          description: '',
          selectedFile: '',
        };
      }

      

      onSubmit = (e) => {
        switch (e.target.name) {
          case 'selectedFile':
            this.setState({ selectedFile: e.target.files[0] });
            break;
          default:
            this.setState({ [e.target.name]: e.target.value });
        }
        e.preventDefault();
        const { description, selectedFile } = this.state;
        let formData = new FormData();

        formData.append('description', description);
        formData.append('selectedFile', selectedFile);

        axios.post('/', formData)
          .then((result) => {
            
          });
      }

      render() {
        const {  selectedFile,description } = this.state;
        return (
          <form id="upload">
          <div id="drop">
    <label for="file-upload" class="custom-file-upload">
    <i class="fa fa-cloud-upload"></i>Upload
</label>
<input id="file-upload" type="file" name="selectedFile"
              onChange={this.onSubmit} />
            
            

           
            
            
            </div>
          </form>
        );
      }
    }
  