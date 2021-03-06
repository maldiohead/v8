// Copyright 2020 the V8 project authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
import {SelectRelatedEvent} from './events.mjs';
import {CollapsableElement, DOM, formatBytes, formatMicroSeconds} from './helper.mjs';

DOM.defineCustomElement('view/code-panel',
                        (templateText) =>
                            class CodePanel extends CollapsableElement {
  _timeline;
  _selectedEntries;
  _entry;

  constructor() {
    super(templateText);
    this._codeSelectNode.onchange = this._handleSelectCode.bind(this);
    this.$('#selectedRelatedButton').onclick =
        this._handleSelectRelated.bind(this)
  }

  set timeline(timeline) {
    this._timeline = timeline;
    this.$('.panel').style.display = timeline.isEmpty() ? 'none' : 'inherit';
    this.requestUpdate();
  }

  set selectedEntries(entries) {
    this._selectedEntries = entries;
    this.entry = entries.first();
  }

  set entry(entry) {
    this._entry = entry;
    if (entry !== undefined) {
      this.$('#properties').propertyDict = {
        '__this__': entry,
        functionName: entry.functionName,
        size: formatBytes(entry.size),
        creationTime: formatMicroSeconds(entry.time / 1000),
        sourcePosition: entry.sourcePosition,
        script: entry.script,
        type: entry.type,
        kind: entry.kindName,
        variants: entry.variants,
      };
    } else {
      this.$('#properties').propertyDict = {};
    }
    this.requestUpdate();
  }

  get _disassemblyNode() {
    return this.$('#disassembly');
  }

  get _sourceNode() {
    return this.$('#sourceCode');
  }

  get _codeSelectNode() {
    return this.$('#codeSelect');
  }

  _update() {
    this._updateSelect();
    this._disassemblyNode.innerText = this._entry?.code ?? '';
    this._sourceNode.innerText = this._entry?.source ?? '';
  }

  _updateSelect() {
    const select = this._codeSelectNode;
    if (select.data === this._selectedEntries) return;
    select.data = this._selectedEntries;
    select.options.length = 0;
    const sorted =
        this._selectedEntries.slice().sort((a, b) => a.time - b.time);
    for (const code of this._selectedEntries) {
      const option = DOM.element('option');
      option.text =
          `${code.functionName}(...) t=${formatMicroSeconds(code.time)} size=${
              formatBytes(code.size)} script=${code.script?.toString()}`;
      option.data = code;
      select.add(option);
    }
  }

  _handleSelectCode() {
    this.entry = this._codeSelectNode.selectedOptions[0].data;
  }

  _handleSelectRelated(e) {
    if (!this._entry) return;
    this.dispatchEvent(new SelectRelatedEvent(this._entry));
  }
});