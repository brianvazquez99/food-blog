
      document.addEventListener('click', () => {
         const container = document.getElementById("searchContainer")
    if (container) {
      const isHidden = container.classList.contains('hidden')
      if (isHidden) container.classList.add('hidden')
    }
      })





  function debounce(func, timeout = 300) {
    let timer;
    console.log('in debounce', func)
    return (...args) => {
      clearTimeout(timer)
      timer = setTimeout(() => { func.apply(this, args) }, timeout);
    }
  }

  function openSearch() {
    event.stopPropagation()
    openHamburger()
    const container = document.getElementById("searchContainer")
    console.log(container)
    if (container) {
      const isHidden = container.classList.contains('hidden')
      isHidden ? container.classList.remove('hidden') : container.classList.add('hidden')
    }

  }


  function onSearch(event) {
    console.log(event)
    fetchSearchData(event)

  }

  const debouncedFetch = debounce((searchString) => {
    fetch(
      "/api/searchBlogs?" +
      new URLSearchParams({ search: searchString }).toString()
    ).then(value => {

      return value.json();

    }).then(data => {

      if (data && data.length > 0) {
        const parent = document.getElementById("resultsContainer")
        if (parent) {
          parent.replaceChildren()
          data.forEach(element => {
            const mainElement = document.createElement("a")
            mainElement.href = '/blogDetails/' + element.SLUG
            mainElement.classList.add("flex")
            mainElement.classList.add("flex-col")
            mainElement.classList.add("items-center")

            const img = document.createElement("img")
            img.src = '/api/getThumbnail/' + element.ID
            img.height = 100
            img.width = 100
            img.alt = element.TITLE
            mainElement.appendChild(img)

            const span = document.createElement("span")
            span.classList.add("title")
            span.innerHTML = element.TITLE
            mainElement.appendChild(span)

            parent.appendChild(mainElement)

          });
        }
      }
    });
  }, 300);

  function fetchSearchData(searchString) {
    console.log(searchString)
    if (searchString == '') return
    debouncedFetch(searchString)

  }

  function jumpToRecipe() {
    document.getElementById('recipe')?.scrollIntoView({
      behavior: 'smooth'
    })
  }

  function openHamburger() {
    const hamburger = document.getElementById("hamburger")
    if (!hamburger) return

    if (hamburger.classList.contains('hidden')) {
      hamburger.classList.remove('hidden')
    }
    else {
      hamburger.classList.add('hidden')
    }
  }
