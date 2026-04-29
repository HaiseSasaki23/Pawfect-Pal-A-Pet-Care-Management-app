/* global gui elements */
const modal = document.getElementById('mainModal');
const confirmModal = document.getElementById('confirmModal');

function closeModal(modalId) { 
    document.getElementById(modalId).style.display = 'none'; 
}