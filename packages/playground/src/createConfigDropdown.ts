type Sandbox = import("typescript-sandbox").Sandbox
type Monaco = typeof import("monaco-editor")

type OptionsSummary = {
  display: string
  oneliner: string
  id: string
  categoryID: string
  categoryDisplay: string
}

// This is where all the localized descriptions come from
declare const optionsSummary: OptionsSummary[]

export const createConfigDropdown = (sandbox: Sandbox, monaco: Monaco) => {
  const configContainer = document.getElementById("config-container")!
  const container = document.createElement("div")
  container.id = "boolean-options-container"
  configContainer.appendChild(container)

  const compilerOpts = sandbox.getCompilerOptions()
  const boolOptions = Object.keys(compilerOpts).filter(k => typeof compilerOpts[k] === "boolean")

  // we want to make sections of categories
  const categoryMap = {} as { [category: string]: { [optID: string]: OptionsSummary } }
  boolOptions.forEach(optID => {
    const summary = optionsSummary.find(sum => optID === sum.id)!

    const existingCategory = categoryMap[summary.categoryID]
    if (!existingCategory) categoryMap[summary.categoryID] = {}

    categoryMap[summary.categoryID][optID] = summary
  })

  Object.keys(categoryMap).forEach(categoryID => {
    const categoryDiv = document.createElement("div")
    const header = document.createElement("h4")
    const ol = document.createElement("ol")

    Object.keys(categoryMap[categoryID]).forEach(optID => {
      const optSummary = categoryMap[categoryID][optID]
      header.textContent = optSummary.categoryDisplay

      const li = document.createElement("li")
      const label = document.createElement("label")
      label.style.position = "relative"
      label.style.width = "100%"

      const svg = `<?xml version="1.0" encoding="UTF-8"?><svg width="20px" height="20px" viewBox="0 0 20 20" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
          <g stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
            <circle stroke="#0B6F57" cx="10" cy="10" r="9"></circle>
            <path d="M9.99598394,6 C10.2048193,6 10.4243641,5.91700134 10.6546185,5.75100402 C10.8848728,5.58500669 11,5.33601071 11,5.00401606 C11,4.66666667 10.8848728,4.41499331 10.6546185,4.24899598 C10.4243641,4.08299866 10.2048193,4 9.99598394,4 C9.79250335,4 9.57563588,4.08299866 9.34538153,4.24899598 C9.11512718,4.41499331 9,4.66666667 9,5.00401606 C9,5.33601071 9.11512718,5.58500669 9.34538153,5.75100402 C9.57563588,5.91700134 9.79250335,6 9.99598394,6 Z M10.6877323,16 L10.6877323,14.8898836 L10.6877323,8 L9.30483271,8 L9.30483271,9.11011638 L9.30483271,16 L10.6877323,16 Z" fill="#0B6F57" fill-rule="nonzero"></path>
          </g>
      </svg>`
      label.innerHTML = `<span>${optSummary.id}</span><a href='../tsconfig#${optSummary.id}' class='compiler_info_link' alt='Look up ${optSummary.id} in the TSConfig Reference'>${svg}</a><br/>${optSummary.oneliner}`

      const input = document.createElement("input")
      input.value = optSummary.id
      input.type = "checkbox"
      input.name = optSummary.id
      input.id = "option-" + optSummary.id

      input.onchange = () => {
        sandbox.updateCompilerSetting(optSummary.id, input.checked)
      }

      label.htmlFor = input.id

      li.appendChild(input)
      li.appendChild(label)
      ol.appendChild(li)
    })

    categoryDiv.appendChild(header)
    categoryDiv.appendChild(ol)
    container.appendChild(categoryDiv)
  })

  const dropdownContainer = document.getElementById("compiler-dropdowns")!

  const target = optionsSummary.find(sum => sum.id === "target")!
  const targetSwitch = createSelect(
    target.display,
    "target",
    target.oneliner,
    sandbox,
    monaco.languages.typescript.ScriptTarget
  )
  dropdownContainer.appendChild(targetSwitch)

  const jsx = optionsSummary.find(sum => sum.id === "jsx")!
  const jsxSwitch = createSelect(jsx.display, "jsx", jsx.oneliner, sandbox, monaco.languages.typescript.JsxEmit)
  dropdownContainer.appendChild(jsxSwitch)

  const modSum = optionsSummary.find(sum => sum.id === "module")!
  const moduleSwitch = createSelect(
    modSum.display,
    "module",
    modSum.oneliner,
    sandbox,
    monaco.languages.typescript.ModuleKind
  )
  dropdownContainer.appendChild(moduleSwitch)
}

export const updateConfigDropdownForCompilerOptions = (sandbox: Sandbox, monaco: Monaco) => {
  const compilerOpts = sandbox.getCompilerOptions()
  const boolOptions = Object.keys(compilerOpts).filter(k => typeof compilerOpts[k] === "boolean")

  boolOptions.forEach(opt => {
    const inputID = "option-" + opt
    const input = document.getElementById(inputID) as HTMLInputElement
    input.checked = !!compilerOpts[opt]
  })

  const compilerIDToMaps: any = {
    module: monaco.languages.typescript.ModuleKind,
    jsx: monaco.languages.typescript.JsxEmit,
    target: monaco.languages.typescript.ScriptTarget,
  }

  Object.keys(compilerIDToMaps).forEach(flagID => {
    const input = document.getElementById("compiler-select-" + flagID) as HTMLInputElement
    const currentValue = compilerOpts[flagID]
    const map = compilerIDToMaps[flagID]
    // @ts-ignore
    const realValue = map[currentValue]
    if (!realValue) return

    // @ts-ignore
    for (const option of input.children) {
      option.selected = option.value.toLowerCase() === realValue.toLowerCase()
    }
  })
}

const createSelect = (title: string, id: string, blurb: string, sandbox: Sandbox, option: any) => {
  const label = document.createElement("label")
  const textToDescribe = document.createElement("span")
  textToDescribe.textContent = title + ":"
  label.appendChild(textToDescribe)

  const select = document.createElement("select")
  select.id = "compiler-select-" + id
  label.appendChild(select)

  select.onchange = () => {
    const value = select.value // the human string
    const compilerIndex = option[value]
    sandbox.updateCompilerSetting(id, compilerIndex)
  }

  Object.keys(option)
    .filter(key => isNaN(Number(key)))
    .forEach(key => {
      // hide Latest
      if (key === "Latest") return

      const option = document.createElement("option")
      option.value = key
      option.text = key

      select.appendChild(option)
    })

  const span = document.createElement("span")
  span.textContent = blurb
  span.classList.add("compiler-flag-blurb")
  label.appendChild(span)

  return label
}

export const setupJSONToggleForConfig = (sandbox: Sandbox) => {}
