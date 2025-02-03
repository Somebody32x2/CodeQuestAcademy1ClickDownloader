let download_directory = null;
let options = {}
chrome.storage.sync.get({
    "open_pdfs": false,
    "download_pdfs": true,
    "download_tests": true,
    "unzip": true,
    "create_solve": true,
    "solve_format": "solve.py",
    "template": "# template",
    "subdir_format": "$name$ ($difficulty$)"
}, (res_options) => {
    options = res_options
});
// try to load options from storage

chrome.storage.onChanged.addListener((changes, namespace) => {
    for (let [key, {oldValue, newValue}] of Object.entries(changes)) {
        if (options[key]) {
            options[key] = newValue;
        }
    }
});


let try_add_dl = () => {
    if (document.querySelectorAll("#resultsList > div.cursor-pointer").length === 0) {
        return;
    }
    document.querySelectorAll("#resultsList > div.cursor-pointer:not(.ext_added_dwn):not(:has(div.flex-row.items-center))").forEach(chal => {
        console.log(convert_to_real_name(chal.children[0].innerText))

        // Create a new div element
        let container = document.createElement("div");
        // add the container to the chal's parent as a sibling right after the chal
        chal.parentNode.insertBefore(container, chal.nextSibling);
        // chal.parentNode.insertBefore(container, chal);
        // container.outerHTML = `
        // <div style="position: relative;">
        //     <button id="ext_dwn_${convert_to_real_name(chal.children[0].innerText)}" style="z-index: 20; position: absolute; right: 10px; bottom: 16px;" class="ext_download_chal bg-gray-800 text-white pt-2 px-2 mr-2 text-xl font-bold rounded shadow hover:shadow-lg ease-linear  transition-all duration-150">🢃</button></div>
        //     `
        container.setAttribute("style", "position: relative;");
        chal.classList.add("ext_added_dwn");
        let button = document.createElement("button");
        button.setAttribute("id", `ext_dwn_${convert_to_real_name(chal.children[0].innerText)}`);
        button.setAttribute("style", "z-index: 20; position: absolute; right: 10px; bottom: 16px;");
        button.setAttribute("class", "ext_download_chal bg-gray-800 text-white pt-2 px-2 mr-2 text-xl font-bold rounded shadow hover:shadow-lg ease-linear transition-all duration-150");
        button.innerText = "🢃";
        container.appendChild(button);

        button.addEventListener("click", async (e) => {
                console.log("clicked " + convert_to_real_name(chal.children[0].innerText))
                if (!download_directory) {
                    alert("Please select a download directory first and try again.");
                    download_directory = await window.showDirectoryPicker({mode: "readwrite", id: "CQA_Challenges"})
                    return;
                }
                let name = convert_to_real_name(chal.children[0].innerText);

                button.style.backgroundColor = "#fdc700";

                // https://lmcodequestacademy.com/api/static/problems/[NAME]
                // https://lmcodequestacademy.com/api/static/samples/[NAME]

                let pdf_res = null;
                let test_res = null;
                if (options.download_pdfs) pdf_res = await fetch(`https://lmcodequestacademy.com/api/static/problems/${name}`);
                if (options.download_pdfs && !pdf_res.ok) {
                    button.style.backgroundColor = "#e7000b";
                    alert("Failed to download PDF for " + name);
                    return;
                }

                if (options.download_tests) test_res = await fetch(`https://lmcodequestacademy.com/api/static/samples/${name}`);
                if (options.download_tests && !test_res.ok) {
                    button.style.backgroundColor = "#e7000b";
                    alert("Failed to download tests for " + name);
                    return;
                }

                // Make a subdir for the challenge
                let subdir_name = options.subdir_format.replaceAll("$name$", name).replaceAll("$difficulty$", chal.children[1].innerText.toLowerCase());
                let chal_dir = await download_directory.getDirectoryHandle(subdir_name, {create: true});

                if (options.download_pdfs) {
                    let pdf_blob = await pdf_res.blob();
                    console.log(pdf_blob.size);
                    if (pdf_blob.size <= 100) {
                        alert("Failed to download PDF for " + name);
                        return;
                    }
                    let pdf_file = await chal_dir.getFileHandle("problem.pdf", {create: true});
                    pdf_file.createWritable().then(writable => {
                        writable.write(pdf_blob);
                        writable.close()
                    });
                }

                if (options.open_pdfs) {
                    window.open(`https://lmcodequestacademy.com/api/static/problems/${name}`, "_blank");
                    console.log("opened " + name);
                }

                if (options.download_tests) {
                    let test_blob = await test_res.blob();
                    if (!options.unzip) {
                        let test_file = await chal_dir.getFileHandle("tests.zip", {create: true});
                        test_file.createWritable().then(writable => {
                            writable.write(test_blob);
                            writable.close()
                        });
                    }

                    if (options.unzip) {
                        const zipFileReader = new zip.ZipReader(new zip.BlobReader(test_blob));
                        console.log(await zipFileReader.getEntries());
                        const entries = await zipFileReader.getEntries();
                        for (const entry of entries) {
                            if (entry.directory) {
                                continue
                            }
                            const writer = await (await chal_dir.getFileHandle(entry.filename, {create: true})).createWritable();
                            await entry.getData(writer);
                        }
                        zipFileReader.close();
                    }
                }

                // Create a solve file
                if (options.create_solve) {
                    let solve_file = await chal_dir.getFileHandle(options.solve_format.replaceAll("$name$", name).replaceAll("$difficulty$", chal.children[1].innerText.toLowerCase()), {create: true});
                    let solve_writer = await solve_file.createWritable();
                    await solve_writer.write(options.template.replaceAll("$name$", name).replaceAll("$difficulty$", chal.children[1].innerText.toLowerCase()));
                    await solve_writer.close();
                }

                button.classList.remove("bg-gray-800");
                button.style.backgroundColor = "green";
            }
        )

    });
}

setInterval(try_add_dl, 1000);

function convert_to_real_name(str) {
    const special_char_map = {
        "$": "dollar",
    }
    const preserved_chars = "abcdefghijklmnopqrstuvwxyz0123456789-";
    str = str.toLowerCase().trim().replaceAll(" ", "-");
    let new_str = "";
    for (let i = 0; i < str.length; i++) {
        if (preserved_chars.includes(str[i])) {
            new_str += str[i];
        } else {
            new_str += special_char_map[str[i]] || "";
        }
    }

    return new_str;
}