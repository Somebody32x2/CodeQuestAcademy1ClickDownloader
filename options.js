// Unfortunately does not work, downloading is done by client
// document.getElementById("select_dir").addEventListener("click", async () => {
//     let res = await window.showDirectoryPicker({mode: "readwrite"});
//     console.log(res);
// });


// Saves options to chrome.storage
const saveOptions = () => {

    chrome.storage.sync.set(
        {
            "open_pdfs": document.getElementById('open_pdfs').checked,
            "download_pdfs": document.getElementById('download_pdfs').checked,
            "download_tests": document.getElementById('download_tests').checked,
            "create_solve": document.getElementById('create_solve').checked,
            "solve_format": document.getElementById('solve_format').value,
            "template": document.getElementById('template').value,
            "subdir_format": document.getElementById('subdir_format').value,
            "unzip": document.getElementById('unzip').checked
        },
        () => {
            // Update status to let user know options were saved.
            const status = document.getElementById('status');
            status.textContent = 'Options saved.';
            setTimeout(() => {
                status.textContent = '';
            }, 750);
        }
    );
};

// Restores select box and checkbox state using the preferences
// stored in chrome.storage.
const restoreOptions = () => {
    chrome.storage.sync.get(
        {
            "open_pdfs": false,
            "download_pdfs": true,
            "download_tests": true,
            "create_solve": true,
            "unzip": true,
            "solve_format": "solve.py",
            "template": "# template",
            "subdir_format": "$name$ ($difficulty$)"
        },
        (items) => {
            document.getElementById('open_pdfs').checked = items.open_pdfs;
            document.getElementById('download_pdfs').checked = items.download_pdfs;
            document.getElementById('download_tests').checked = items.download_tests;
            document.getElementById('create_solve').checked = items.create_solve;
            document.getElementById('solve_format').value = items.solve_format;
            document.getElementById('template').value = items.template;
            document.getElementById('subdir_format').value = items.subdir_format
            document.getElementById('unzip').checked = items.unzip;
        }
    );
};

document.addEventListener('DOMContentLoaded', restoreOptions);
document.getElementById('save').addEventListener('click', saveOptions);
document.getElementById('reset').addEventListener('click', () => {
    chrome.storage.sync.clear(() => {
        restoreOptions();
        const status = document.getElementById('status');
        status.textContent = 'Options reset.';
        setTimeout(() => {
            status.textContent = '';
        }, 750);
    });
});
