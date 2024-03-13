/**
 * Observes changes in a specific URL query parameter and executes a callback function when a change is detected.
 *
 * @param {string} queryParam - The URL query parameter to observe for changes.
 * @param {Function} callback - A callback function that is executed when the observed query parameter changes. The new value of the parameter is passed as an argument to this function.
 */
export function observeChanges(queryParam, callback) {
  let oldParamValue = new URLSearchParams(window.location.search).get(
    queryParam
  );

  const observerCallback = () => {
    let newParamValue = new URLSearchParams(window.location.search).get(
      queryParam
    );
    if (oldParamValue !== newParamValue) {
      oldParamValue = newParamValue;
      callback(newParamValue);
    }
  };

  window.addEventListener("load", observerCallback);

  const observer = new MutationObserver(observerCallback);
  observer.observe(document.querySelector("body"), {
    childList: true,
    subtree: true,
  });
}

// Usage

/**
 * Observes changes to the 'variant' URL query parameter.
 */
observeChanges("variant", (newVariant) => {
  console.log(`URL updated! New Variant: ${newVariant}`);
});
